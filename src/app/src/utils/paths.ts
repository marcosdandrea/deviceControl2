const isHeadless = process.argv.includes('--headless') || process.argv.includes('--h') || process.env.HEADLESS === 'true'

export const getAppPath = async (): Promise<string> => {
  if (isHeadless) {
    return process.cwd();
  }
  const { app } = await import ("electron")

  return app.getAppPath()
}

export const getUserDataPath = async (): Promise<string> => {
  if (isHeadless) {
    return process.cwd();
  }
  const { app } = await import ("electron")
  return app.getPath("userData");
}