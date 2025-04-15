import * as fs from'node:fs/promises'
import * as path from 'node:path'

// Example usage:
const directoryToSearch = 'J:/share/emu/ROMVault_V3.7.2/DatArchive/TOSEC - DAT Pack - Complete (4743) (TOSEC-v2025-03-13)/TOSEC' // Current directory
const romscs = process.argv[2]
findInAllRoms(romscs)

async function findTextInFiles(dir, text) {
  const files = await fs.readdir(dir)

  for (const file of files) {
    if(!file.toLowerCase().includes('atari 2600')) continue
    //console.log('ftif:', file)
    const filePath = path.join(dir, file)
    const stat = await fs.stat(filePath)

    if (stat.isDirectory())
      await findTextInFiles(filePath, text) // Recursive call for subdirectories
     else if (stat.isFile()) {
      try {
        const content = await fs.readFile(filePath, 'utf-8')
        if (content.includes(text))
          console.log(`found in ${file}`)
      } catch (error) {
        console.error(`Error reading file ${filePath}: ${error.message}`)
      }
    }
  }
}

async function findInAllRoms(romscs)
{
    console.log(romscs)
    const files = await ((await fs.readFile(romscs)).toString().split('\r\n'))

    //console.log(files)
    for (let i = 1; i < files.length; i++) {
        const f = files[i]
        let l = f.split(';')
        let cs = l[1], fn = l[6]
        console.log(`${cs}, ${fn}`)

        await findTextInFiles(directoryToSearch, cs)
        //.then(() => console.log('Search complete.'))
         //.catch(error => console.error('An error occurred:', error))

    }


}



