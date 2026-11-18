import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

function folderComparePlugin() {
  return {
    name: 'folder-compare-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0];

        if (req.method === 'POST' && url === '/api/scan-folders') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const { leftPath, rightPath } = JSON.parse(body);

              if (!leftPath || !rightPath) {
                res.statusCode = 400;
                res.end(JSON.stringify({ ok: false, error: 'Both leftPath and rightPath are required' }));
                return;
              }

              const resolvedLeft = path.resolve(leftPath);
              const resolvedRight = path.resolve(rightPath);

              if (!fs.existsSync(resolvedLeft)) {
                res.statusCode = 400;
                res.end(JSON.stringify({ ok: false, error: `Left path does not exist: ${resolvedLeft}` }));
                return;
              }

              if (!fs.existsSync(resolvedRight)) {
                res.statusCode = 400;
                res.end(JSON.stringify({ ok: false, error: `Right path does not exist: ${resolvedRight}` }));
                return;
              }

              const leftFiles = scanDirectory(resolvedLeft);
              const rightFiles = scanDirectory(resolvedRight);

              const allRelativePaths = Array.from(new Set([...Object.keys(leftFiles), ...Object.keys(rightFiles)])).sort();

              const comparison = allRelativePaths.map(relPath => {
                const leftItem = leftFiles[relPath];
                const rightItem = rightFiles[relPath];

                if (leftItem && !rightItem) {
                  return {
                    relPath,
                    status: 'left_only',
                    leftSize: leftItem.size,
                    leftModified: leftItem.modified,
                    rightSize: null,
                    rightModified: null,
                    leftFullPath: leftItem.fullPath,
                    rightFullPath: null,
                    diffCount: null
                  };
                }

                if (!leftItem && rightItem) {
                  return {
                    relPath,
                    status: 'right_only',
                    leftSize: null,
                    leftModified: null,
                    rightSize: rightItem.size,
                    rightModified: rightItem.modified,
                    leftFullPath: null,
                    rightFullPath: rightItem.fullPath,
                    diffCount: null
                  };
                }

                // ── Fast Comparison Engine (Industry Standard like Beyond Compare) ──
                // 1. If sizes differ, guaranteed different! Zero disk read required.
                if (leftItem.size !== rightItem.size) {
                  return {
                    relPath,
                    status: 'different',
                    leftSize: leftItem.size,
                    rightSize: rightItem.size,
                    leftModified: leftItem.modified,
                    rightModified: rightItem.modified,
                    leftFullPath: leftItem.fullPath,
                    rightFullPath: rightItem.fullPath,
                    diffCount: 1
                  };
                }

                // 2. If size is identical and modification date matches within 1 sec -> identical (0ms)
                const timeDiff = Math.abs(new Date(leftItem.modified).getTime() - new Date(rightItem.modified).getTime());
                if (timeDiff < 1000) {
                  return {
                    relPath,
                    status: 'identical',
                    leftSize: leftItem.size,
                    rightSize: rightItem.size,
                    leftModified: leftItem.modified,
                    rightModified: rightItem.modified,
                    leftFullPath: leftItem.fullPath,
                    rightFullPath: rightItem.fullPath,
                    diffCount: 0
                  };
                }

                // 3. If size is 0 and timestamps differ, still both empty
                if (leftItem.size === 0) {
                  return {
                    relPath,
                    status: 'identical',
                    leftSize: 0,
                    rightSize: 0,
                    leftModified: leftItem.modified,
                    rightModified: rightItem.modified,
                    leftFullPath: leftItem.fullPath,
                    rightFullPath: rightItem.fullPath,
                    diffCount: 0
                  };
                }

                // 4. Large files (> 1MB): compare header/footer chunks in memory-safe buffers
                if (leftItem.size > 1024 * 1024) {
                  const isSame = compareLargeFiles(leftItem.fullPath, rightItem.fullPath, leftItem.size);
                  return {
                    relPath,
                    status: isSame ? 'identical' : 'different',
                    leftSize: leftItem.size,
                    rightSize: rightItem.size,
                    leftModified: leftItem.modified,
                    rightModified: rightItem.modified,
                    leftFullPath: leftItem.fullPath,
                    rightFullPath: rightItem.fullPath,
                    diffCount: isSame ? 0 : 1
                  };
                }

                // 5. Small files (<= 1MB): read buffer and compare
                let status = 'identical';
                let diffCount = 0;
                try {
                  const leftBuf = fs.readFileSync(leftItem.fullPath);
                  const rightBuf = fs.readFileSync(rightItem.fullPath);
                  if (!leftBuf.equals(rightBuf)) {
                    status = 'different';
                    diffCount = 1;
                    if (leftItem.size < 100 * 1024 && relPath.endsWith('.json')) {
                      try {
                        const lObj = JSON.parse(leftBuf.toString('utf-8'));
                        const rObj = JSON.parse(rightBuf.toString('utf-8'));
                        diffCount = estimateJsonDiffs(lObj, rObj);
                      } catch {}
                    }
                  }
                } catch {
                  status = 'different';
                  diffCount = 1;
                }

                return {
                  relPath,
                  status,
                  leftSize: leftItem.size,
                  rightSize: rightItem.size,
                  leftModified: leftItem.modified,
                  rightModified: rightItem.modified,
                  leftFullPath: leftItem.fullPath,
                  rightFullPath: rightItem.fullPath,
                  diffCount
                };
              });

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                ok: true,
                leftPath: resolvedLeft,
                rightPath: resolvedRight,
                files: comparison
              }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ ok: false, error: err.message }));
            }
          });
          return;
        }

        if (req.method === 'POST' && url === '/api/read-file-pair') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const { leftFullPath, rightFullPath } = JSON.parse(body);
              const MAX_DIFF_SIZE = 15 * 1024 * 1024; // 15MB limit for live text diff

              let leftContent = '';
              let rightContent = '';

              if (leftFullPath && fs.existsSync(leftFullPath)) {
                const statL = fs.statSync(leftFullPath);
                if (statL.size > MAX_DIFF_SIZE) {
                  leftContent = `/* File exceeds 15MB (${(statL.size / 1024 / 1024).toFixed(1)}MB). Live diff preview disabled for memory protection. */`;
                } else {
                  leftContent = fs.readFileSync(leftFullPath, 'utf-8');
                }
              }

              if (rightFullPath && fs.existsSync(rightFullPath)) {
                const statR = fs.statSync(rightFullPath);
                if (statR.size > MAX_DIFF_SIZE) {
                  rightContent = `/* File exceeds 15MB (${(statR.size / 1024 / 1024).toFixed(1)}MB). Live diff preview disabled for memory protection. */`;
                } else {
                  rightContent = fs.readFileSync(rightFullPath, 'utf-8');
                }
              }

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                ok: true,
                leftContent,
                rightContent
              }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ ok: false, error: err.message }));
            }
          });
          return;
        }

        if (req.method === 'POST' && url === '/api/save-file') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const { filePath, content } = JSON.parse(body);
              if (!filePath) {
                res.statusCode = 400;
                res.end(JSON.stringify({ ok: false, error: 'filePath is required' }));
                return;
              }
              const resolved = path.resolve(filePath);
              fs.mkdirSync(path.dirname(resolved), { recursive: true });
              fs.writeFileSync(resolved, content, 'utf-8');

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true, filePath: resolved }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ ok: false, error: err.message }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}

function compareLargeFiles(pathA, pathB, size) {
  try {
    const fdA = fs.openSync(pathA, 'r');
    const fdB = fs.openSync(pathB, 'r');
    const chunkSize = Math.min(64 * 1024, size);
    const bufA = Buffer.alloc(chunkSize);
    const bufB = Buffer.alloc(chunkSize);

    // Read first chunk
    fs.readSync(fdA, bufA, 0, chunkSize, 0);
    fs.readSync(fdB, bufB, 0, chunkSize, 0);
    if (!bufA.equals(bufB)) {
      fs.closeSync(fdA);
      fs.closeSync(fdB);
      return false;
    }

    // Read last chunk
    const endPos = Math.max(0, size - chunkSize);
    fs.readSync(fdA, bufA, 0, chunkSize, endPos);
    fs.readSync(fdB, bufB, 0, chunkSize, endPos);
    fs.closeSync(fdA);
    fs.closeSync(fdB);
    return bufA.equals(bufB);
  } catch {
    return false;
  }
}

function scanDirectory(baseDir, currentDir = '', fileMap = {}) {
  const fullCurrent = path.join(baseDir, currentDir);
  let entries;
  try {
    entries = fs.readdirSync(fullCurrent, { withFileTypes: true });
  } catch {
    return fileMap;
  }

  const ignoreList = new Set([
    'node_modules', '.git', 'dist', 'build', '.idea', '.vscode',
    '.gradle', 'target', '.next', '.cache', 'bin', 'obj'
  ]);

  for (const entry of entries) {
    const lower = entry.name.toLowerCase();
    if (ignoreList.has(lower) || lower.startsWith('.git')) {
      continue;
    }

    const relPath = path.join(currentDir, entry.name).replace(/\\/g, '/');
    const fullPath = path.join(baseDir, relPath);

    if (entry.isDirectory()) {
      scanDirectory(baseDir, relPath, fileMap);
    } else if (entry.isFile()) {
      try {
        const stat = fs.statSync(fullPath);
        fileMap[relPath] = {
          size: stat.size,
          modified: stat.mtime.toISOString(),
          fullPath
        };
      } catch { }
    }
  }

  return fileMap;
}

function estimateJsonDiffs(a, b) {
  let diffs = 0;
  function comp(x, y) {
    if (x === y) return;
    if (x === null || y === null || typeof x !== typeof y) {
      diffs++;
      return;
    }
    if (typeof x !== 'object') {
      diffs++;
      return;
    }
    if (Array.isArray(x) !== Array.isArray(y)) {
      diffs++;
      return;
    }
    const keys = Array.from(new Set([...Object.keys(x), ...Object.keys(y)]));
    for (const k of keys) {
      if (!(k in x) || !(k in y)) {
        diffs++;
      } else {
        comp(x[k], y[k]);
      }
    }
  }
  comp(a, b);
  return Math.max(1, diffs);
}

export default defineConfig({
  plugins: [react(), folderComparePlugin()],
  server: {
    port: 3000,
    open: false,
  },
});
