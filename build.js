const fs = require('fs')
const path = require('path')

const mergeDependencies = (scriptDir, scriptFile) => {
    const inputScript = path.join(scriptDir, scriptFile)
    const outputScriptDir = path.join(scriptDir, 'dist')

    if (!fs.existsSync(outputScriptDir)) {
        fs.mkdirSync(outputScriptDir)
    }

    const outputScript = path.join(outputScriptDir, path.basename(scriptFile))

    const scriptContent = fs.readFileSync(inputScript, 'utf-8')

    const dependencies = []
    const requireRegex = /\/\/\s*@require\s+(.*)/g
    let match

    const findJavaScriptFiles = (dir) => {
        const files = fs.readdirSync(dir)
        const result = {
            regular: [],
            mods: []
        }

        // First process all subdirectories
        files.forEach((file) => {
            const filePath = path.join(dir, file)
            const stat = fs.statSync(filePath)
            if (stat.isDirectory()) {
                const subResults = findJavaScriptFiles(filePath)
                result.regular.push(...subResults.regular)
                result.mods.push(...subResults.mods)
            }
        })

        // Then process all files in the current directory
        files.forEach((file) => {
            const filePath = path.join(dir, file)
            const stat = fs.statSync(filePath)
            if (!stat.isDirectory() && file.endsWith('.js')) {
                // Separate .mod.js files from regular .js files
                if (file.endsWith('.mod.js')) {
                    result.mods.push(filePath)
                } else {
                    result.regular.push(filePath)
                }
            }
        })

        return result
    }

    // Process @require directives
    while ((match = requireRegex.exec(scriptContent)) !== null) {
        const requirePath = match[1].trim()

        // Check if the requirePath is a URL
        if (/^https?:\/\//.test(requirePath)) {
            // Ignore lines where the path is a URL
            continue
        }

        const wildcardPath = requirePath.replace('@require', '').trim().replace(/\*$/, '')
        const fullPath = path.join(scriptDir, wildcardPath)

        if (fs.existsSync(fullPath)) {
            const stat = fs.statSync(fullPath)
            if (stat.isFile() && fullPath.endsWith('.js')) {
                // If it's a JavaScript file, add it directly to dependencies
                dependencies.push(fullPath)
            } else if (stat.isDirectory()) {
                // If it's a directory, recursively find JavaScript files
                const results = findJavaScriptFiles(fullPath)
                dependencies.push(...results.regular, ...results.mods)
            }
        } else {
            console.error(`Error: Path ${fullPath} specified in @require directive does not exist.`)
        }
    }

    const writeStream = fs.createWriteStream(outputScript)

    const writeDependencyHeader = (dependencyName) => {
        const headerLength = 35 // Max length of the header
        const paddingLength = Math.max(0, (headerLength - dependencyName.length) / 2)
        const leftPadding = '#'.repeat(Math.ceil(paddingLength))
        const rightPadding = '#'.repeat(Math.floor(paddingLength))
        writeStream.write(`/* ${leftPadding} ${dependencyName} ${rightPadding} */\n\n`)
    }

    const writeDependencyFooter = (dependencyName) => {
        const footerLength = 35 // Max length of the footer
        const paddingLength = Math.max(0, (footerLength - dependencyName.length - 7) / 2)
        const leftPadding = '-'.repeat(Math.ceil(paddingLength))
        const rightPadding = '-'.repeat(Math.floor(paddingLength))
        writeStream.write(`\n/* ${leftPadding} end of ${dependencyName} ${rightPadding} */\n\n\n`)
    }

    const scriptLines = scriptContent.split('\n')
    let inMetaBlock = false

    scriptLines.forEach((line) => {
        const trimmedLine = line.trim()

        if (trimmedLine === '// ==UserScript==') {
            inMetaBlock = true
        }

        if (inMetaBlock && trimmedLine.startsWith('// @require')) {
            if (!trimmedLine.includes('http://') && !trimmedLine.includes('https://')) {
                // Skip @require lines within the meta block if they are not URLs
                return
            }
        }

        if (trimmedLine === '// ==/UserScript==') {
            inMetaBlock = false
        }

        if (trimmedLine === '// ;INJECT DEPENDENCIES;') {
            dependencies.forEach((dependency) => {
                const dependencyName = path.basename(dependency)
                writeDependencyHeader(dependencyName)

                const dependencyContent = fs.readFileSync(dependency, 'utf-8')
                writeStream.write(dependencyContent + '\n')

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
