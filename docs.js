const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')

// Function to recursively find all .d.ts files in a directory
const getDtsFiles = (dir, files = []) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            getDtsFiles(fullPath, files)
        } else if (entry.isFile() && entry.name.endsWith('.d.ts')) {
            files.push(fullPath)
        }
    }
    return files
}

// Function to run TypeDoc
const runTypedoc = (files) => {
    const fileList = files.join(' ')
    const command = `npx typedoc --out docs ${fileList}`
    console.log(`Running command: ${command}`)
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`)
            return
        }
        if (stderr) {
            console.error(`Stderr: ${stderr}`)
            return
        }
        console.log(`Stdout: ${stdout}`)
    })
}

// Get directory from command-line arguments
const args = process.argv.slice(2)
const directoryToTraverse = args[0] || 'src' // Default to 'src' if no argument provided

if (!fs.existsSync(directoryToTraverse)) {
    console.error(`Directory ${directoryToTraverse} does not exist.`)
    process.exit(1)
}

// Get all .d.ts files
const dtsFiles = getDtsFiles(directoryToTraverse)

// Run TypeDoc with the .d.ts files
if (dtsFiles.length > 0) {
    runTypedoc(dtsFiles)
} else {
    console.log('No .d.ts files found.')
}
