import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

let poseProcess: ReturnType<typeof spawn> | null = null

export async function POST() {
  // Don't spawn if already running
  if (poseProcess && !poseProcess.killed) {
    return NextResponse.json({ status: 'already_running' })
  }

  const projectRoot = process.cwd()
  const scriptPath = path.join(projectRoot, 'pose_server.py')

  // Try py first (Windows), fall back to python3 (Mac/Linux)
  const pythonCmd = process.platform === 'win32' ? 'py' : 'python3'

  poseProcess = spawn(pythonCmd, [scriptPath], {
    cwd: projectRoot,
    detached: false,
    stdio: 'pipe',
  })

  poseProcess.stdout?.on('data', (d) => console.log('[pose_server]', d.toString()))
  poseProcess.stderr?.on('data', (d) => console.error('[pose_server]', d.toString()))
  poseProcess.on('exit', (code) => {
    console.log(`[pose_server] exited with code ${code}`)
    poseProcess = null
  })

  // Give it 1.5 seconds to start then return
  await new Promise(r => setTimeout(r, 1500))
  return NextResponse.json({ status: 'started', pid: poseProcess?.pid })
}

export async function GET() {
  return NextResponse.json({
    running: poseProcess !== null && !poseProcess.killed
  })
}
