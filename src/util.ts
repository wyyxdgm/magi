// nodejs 引入child_process 封装运行方法
import { exec } from 'child_process';
// execPromise
export function execPromise(cmd: string) {
  return new Promise((resolve, reject) => {
      exec(cmd, (err, stdout, stderr) => {
          if (err) {
              reject(err);
          }
          resolve(stdout);
      });
  });
}

export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}