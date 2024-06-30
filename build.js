const fs = require('fs')
const path = require('path')

const mergeDependencies = (scriptDir, scriptFile) => {
    const inputScript = path.join(scriptDir, scriptFile)
    const outputScriptDir = path.join(scriptDir, 'dist')

    // Ensure the dist directory exists
    if (!fs.existsSync(outputScriptDir)) {
        fs.mkdirSync(outputScriptDir)
    }

    const outputScript = path.join(outputScriptDir, path.basename(scriptFile))

    // Read the input script
    const scriptContent = fs.readFileSync(inputScript, 'utf-8')

    // Extract dependencies from the userscript
    const dependencies = []
    const requireRegex = /\/\/\s*@require\s+(.*)/g
    let match

    // Function to recursively find JavaScript files in a directory
    const findJavaScriptFiles = (dir) => {
        const files = fs.readdirSync(dir)
        files.forEach((file) => {
            const filePath = path.join(dir, file)
            const stat = fs.statSync(filePath)
            if (stat.isDirectory()) {
                findJavaScriptFiles(filePath) // Recursively search subdirectories
            } else if (file.endsWith('.js')) {
                dependencies.push(filePath) // Add JavaScript file to dependencies
            }
        })
    }

    // Process @require directives
    while ((match = requireRegex.exec(scriptContent)) !== null) {
        const requirePath = match[1]
        const wildcardPath = requirePath.replace('@require', '').trim().replace(/\*$/, '')
        const wildcardDir = path.join(scriptDir, wildcardPath)

        if (fs.existsSync(wildcardDir)) {
            findJavaScriptFiles(wildcardDir)
        } else {
            console.error(`Error: Directory ${wildcardDir} specified in @require directive does not exist.`)
        }
    }

    // Create a write stream for the output script
    const writeStream = fs.createWriteStream(outputScript)

    // Function to write header for each dependency
    const writeDependencyHeader = (dependencyName) => {
        const headerLength = 35 // Max length of the header
        const paddingLength = Math.max(0, (headerLength - dependencyName.length) / 2)
        const leftPadding = '#'.repeat(Math.ceil(paddingLength))
        const rightPadding = '#'.repeat(Math.floor(paddingLength))
        writeStream.write(`/* ${leftPadding} ${dependencyName} ${rightPadding} */\n\n`)
    }

    // Function to write footer for each dependency
    const writeDependencyFooter = (dependencyName) => {
        const footerLength = 35 // Max length of the footer
        const paddingLength = Math.max(0, (footerLength - dependencyName.length - 7) / 2)
        const leftPadding = '-'.repeat(Math.ceil(paddingLength))
        const rightPadding = '-'.repeat(Math.floor(paddingLength))
        writeStream.write(`\n/* ${leftPadding} end of ${dependencyName} ${rightPadding} */\n\n\n`)
    }

    // Read the input script line by line and inject dependencies
    const scriptLines = scriptContent.split('\n')
    let inMetaBlock = false

    scriptLines.forEach((line) => {
        const trimmedLine = line.trim()

        if (trimmedLine === '// ==UserScript==') {
            inMetaBlock = true
        }

        if (inMetaBlock && trimmedLine.startsWith('// @require')) {
            // Skip @require lines within the meta block
            return
        }

        if (trimmedLine === '// ==/UserScript==') {
            inMetaBlock = false
        }

        if (trimmedLine === '// ;INJECT DEPENDENCIES;') {
            // Inject dependencies with a newline between each
            dependencies.forEach((dependency) => {
                const dependencyName = path.basename(dependency)
                writeDependencyHeader(dependencyName)

                const dependencyContent = fs.readFileSync(dependency, 'utf-8')
                writeStream.write(dependencyContent + '\n') // Write dependency content

                writeDependencyFooter(dependencyName)
            })
        } else {
            writeStream.write(line + '\n')
        }
    })

    writeStream.end()
    console.log(`Dependencies have been merged into ${outputScript}`)
}

// Usage example: node build.js scriptdir1 myscript.user.js
const args = process.argv.slice(2)

if (args.length < 1 || args.length > 2) {
    console.error('Usage: node build.js <script-directory> [userscript-filename]')
    process.exit(1)
}

const scriptDir = args[0]
let scriptFile = args[1]

if (!scriptFile) {
    const userScriptFiles = fs.readdirSync(scriptDir).filter((file) => file.endsWith('.user.js'))

    if (userScriptFiles.length === 0) {
        console.error('Error: No userscript (.user.js) file found in the specified directory.')
        process.exit(1)
    } else if (userScriptFiles.length > 1) {
        console.error('Error: Multiple userscript (.user.js) files found in the specified directory. Please specify the file name.')
        process.exit(1)
    } else {
        scriptFile = userScriptFiles[0]
    }
}

mergeDependencies(scriptDir, scriptFile)
