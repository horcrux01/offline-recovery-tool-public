const { spawn } = require('child_process')

// spawn in a new process group, inherit stdout/stderr but ignore stdin
const child = spawn('yarn', ['run','dev'], {
  detached: true,
  stdio: ['ignore', 'inherit', 'inherit']
})

child.unref()
console.log('Dev server launched in background')

