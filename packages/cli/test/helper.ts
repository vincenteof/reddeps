import { spawn, SpawnOptionsWithoutStdio } from 'child_process'

export const spawnAsPromise = (
  command: string,
  args?: readonly string[] | undefined,
  options?: SpawnOptionsWithoutStdio | undefined
) => {
  return new Promise<{ stderr: string; stdout: string }>((resolve, reject) => {
    const child = spawn(command, args, options)
    let stderr = ''
    let stdout = ''

    child.stdout.on('data', (data) => {
      stdout += data
    })
    child.stderr.on('data', (data) => {
      stderr += data
    })

    child.on('close', (code) => {
      code === 0 ? resolve({ stderr, stdout }) : reject({ stderr, stdout })
    })
    child.on('error', (err) => {
      reject(err.toString())
    })

    // if (input) {
    //   child.stdin.write(input)
    //   child.stdin.end()
    // }
  })
}
