(async function() {

const Audio = document.getElementById("Audio")
, fileInput = document.getElementById("file-input")
, datfileInput = document.getElementById("datfile-input")
, selZFiles = document.getElementById("selZFiles")
, selDFiles = document.getElementById("selDFiles")
, FileCS = document.getElementById("FileCS")
, CasCS = document.getElementById("CasCS")
, WavCS = document.getElementById("WavCS")
, taBas = document.getElementById("taBas")
, lblCount = document.getElementById("lblCount")
,c_table = makeCRCTable()
, cfg = {checksums: ['SHA-1','CRC32'] }
console.log('cfg: ', cfg)

fileInput.onchange = readFilesCStext // readFilesCSJson //readZipFiles //readFile
datfileInput.onchange =  readDatFiles //readZipFiles //readFile
selZFiles.ondblclick = selZFilesOnChange

let zentries

const enc = new TextDecoder("utf-8")
function encStr(s) { return new TextEncoder("utf-8").encode(s) }
function decStr(b) { return new TextDecoder("utf-8").decode(b) }

document.getElementById("btnTest").addEventListener('click', () => {
    table.clearFilter()
    dtable.clearFilter()
    console.log('Button clicked!', gamesTable.length, datsTable.length, datsTable[0] )
    for (let g of gamesTable){
        let f = datsTable.filter(f=> f.crc == g.crc)
        g.match = f.length
    }
    table.setData(gamesTable)
})

async function readFileAsync(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => { resolve(reader.result) }
        reader.onerror = (error) => { reject(error) }
        reader.readAsText(file) // Or other read method
    })
}

async function readDatFiles(event)
{
    for (const file of event.target.files) {
        if(file.name.endsWith(".zip"))
             return await readZipFiles(file)

        const reader = new FileReader()
        reader.addEventListener("load", () => {
             let jDat = xml2js(reader.result)
             console.log(jDat)
             }, false )
        reader.readAsText(file)
       
        //const arrayBuffer = await file.arrayBuffer()
        readDatFileType(await readFileAsync(file))
    }
}

async function readDatFileType(datText)
{
    const jDat = xml2js(datText)
    if(jDat.body){
        console.log(jDat)
        printMsg(jDat.body.parsererror.div._)

    }
    

    if(jDat.game && jDat.game[0].rom == undefined) 
        await readDatFilesNIDB(jDat)
    else if(jDat.header)
        await readDatFile(jDat)
    else await readMameDatFile(jDat)

}


async function readMameDatFile(jDat)
{
    //mame 0.78 mame.game.rom
    //mame 0.139 mame.game.rom
    //mame 0.276 mame.machine.rom
    console.log(jDat)
    let games = jDat.machine ? jDat.machine : jDat.game
    //console.log(games.length)
    for (const game of games) {
        console.log(`${game.$.name} ${game.description} ${game.year} ${game.manufacturer} ${game.rom ? game.rom.length: 0}`)
        
        if(game.rom && Array.isArray(game.rom))
             for (const r of game.rom){
                console.log(`r: ${r.$.name} ${r.$.size} ${r.$.crc} ${r.$.sha1}`)
                datsTable.push({
                    glen: games.length, zname: undefined, zsize: undefined,
                    name: game.$.name, rname: r.$.name, match: 0, size: r.$.size,
                    crc: r.$.crc, crcMatch: undefined, sha1: r.$.sha1, sha1Match: undefined
                    , description: game.description
                })
            }
    }
    dtable.setData(datsTable)
    console.log("Done")
}

    //TOSEC
async function readDatFile(jDat)
{
    if(jDat.header){
        const h = jDat.header
        console.log(h)
        printMsg(`Loading ${h.name} - ${h.category} - Ver: ${h.version} ${jDat.game.length | 0}`)
    }     
    
    if(jDat.game && !Array.isArray(jDat.game)){
        console.log('only 1 game?!')
        jDat.game = [jDat.game]
    } else {
        if(jDat.game.length == 0){
            printMsg('No Games found!', jDat.game.length)
            return "No Games Found!"
        }
    } 
    console.log(jDat.game[0].rom)
    //datsTable = []
    for (const g of jDat.game) {
        let roms = Array.isArray(g.rom) ? g.rom : [g.rom]
        for (const r of roms){ 
            console.log(g.$.name, r.$.crc )
            //if(!datsTable.some( i => i.crc == r.$.crc))
                datsTable.push({ glen: jDat.game.length, dname: g.$.name, match: 0, size:   r.$.size, crc:     r.$.crc, md5: r.$.md5,   sha1: r.$.sha1 })
        }
    }
    dtable.setData(datsTable)
}

//NoIntro DB
//datafile.game.source.file.crc32
    async function readDatFilesNIDB(jDat) {
        for (const g of jDat.game) {
            console.log(g.$.name)
            if (g.source) {
                let sources = !Array.isArray(g.source) ? [g.source] : g.source
                for (const gs of sources) {
                    if (gs.file) {
                        let files = Array.isArray(gs.file) ? gs.file : [gs.file]
                        for (const gsf of files) {
                            //console.log(g.$.name, gsf.$.crc32 )
                            //if (!datsTable.some(i => i.crc == gsf.$.crc32))
                                datsTable.push({ glen: jDat.game.length, dname: g.$.name, match: 0, size: gsf.$.size, crc: gsf.$.crc32, md5: gsf.$.md5, sha1: gsf.$.sha1, bad: gsf.$.bad, region: g.archive.$.region })
                        }
                    }
                }
            }
        }
        dtable.setData(datsTable)
    }

function parseSystemInfoTxt(si)
{
    const ls = `${si}:\n`.split(/\r\n|\n\r|\r|\n/)
    console.log("si:", ls)
    let sysinfo = {}, sec = [], sn = ""

    for (l of ls) {
        l = l.trim()
        if(l == "") continue
        if(l.endsWith(":")){
            if(sec.length > 0) sysinfo[sn] = sec
            sn = l.replace(":","")
            sec = []
        }
        else sec.push(l)
    }
    return sysinfo
}

    async function readFilesCStext() {
        console.log('f:')

        const files = Array.from(fileInput.files) // Convert FileList to array
        const f = files.find(f => f.name.toLowerCase() == "systeminfo.txt")
        let folder = "?"

        if (f) {
            //const arrayBuffer = await f.arrayBuffer()
            //let si = parseSystemInfoTxt(decStr(arrayBuffer))
            let si = parseSystemInfoTxt(readFileAsync(f))
            folder = si["full system name"]
            console.log("folder: ", folder)
        }

        for (const file of fileInput.files) {
            console.log("fn: ", file.name)
            if (file.name.toLowerCase().endsWith(".zip") ) {
                const { entries } = await unzipit.unzip(file)
                for (const [name, entry] of Object.entries(entries)) {
                    //console.log(entry)
                    if (cfg.checksums != undefined) {
                        checksums = await checkSums(new Uint8Array(await entry.arrayBuffer()), cfg.checksums)
                        console.log("cs:", checksums)
                    }

                    const crc = entry._rawEntry.crc32.toString(16).padStart(8, "0")
                    //matches = dat.filter(f=> f[0].crc == crc)
                    //const matches = games.filter(f=> f.source && f.source[0].file && f.source[0].file[0].$.crc32 == crc ) //NoIntro .json
                    //const matches = gamesTable.filter(f=> f.crc == crc ) //NoIntro .json
                    let fi = gamesTable.findIndex(i => i.crc == crc)
                    if (fi >= 0) {
                        gamesTable[fi].folder = folder
                        gamesTable[fi].match = 1
                        gamesTable[fi].crcMatch = crc == checksums.CRC32
                        gamesTable[fi].sha1Match = gamesTable[fi].sha1 == checksums.SHA1
                        gamesTable[fi].zsize = entry.compressedSize
                        gamesTable[fi].zname = name
                        console.log(gamesTable[fi])
                    } else
                        gamesTable.push({
                            folder: folder,
                            fname: file.name,
                            zname: name,
                            zsize: entry.compressedSize, size: entry.size, match: 0, crc: crc, crcMatch: crc == checkSums.crc32, sha1: checksums.SHA1 })

                    taBas.value += `\n${name} bytes: ${entry.size} crc: ${crc}, match: ${fi} `
                }
            }else{
                const arrayBuffer = await file.arrayBuffer()
                const buf = new Uint8Array(arrayBuffer)
                const checksums =  await checkSums(buf, cfg.checksums)
                let fi = gamesTable.findIndex(i => i.crc == checksums.CRC32)
                if (fi >= 0) {
                    gamesTable[fi].fname = file.name
                    gamesTable[fi].folder = folder
                    gamesTable[fi].match = 1
                    gamesTable[fi].crcMatch = 1
                    gamesTable[fi].sha1Match = gamesTable[fi].sha1 == checksums.SHA1
                    gamesTable[fi].size = file.size
                    console.log(gamesTable[fi])
                } else
                gamesTable.push({
                     folder: folder, fname: file.name,
                     //zname: null, zsize: null,
                      size: file.size, match: -2, crc: checksums.CRC32,
                      //crcMatch:  null,
                       sha1: checksums.SHA1 })
            }
        }
        table.setData(gamesTable)
    }


async function readFilesCSJson(f)
{
    console.log('rfCSJson:', dat)

    const games = dat.datafile.game
    console.log(games.length, cfg)

    for (const file of fileInput.files) {
        const arrayBuffer = await file.arrayBuffer()
        let checksums
        //const sha1 = await SHAbuf(arrayBuffer)
        const {entries} = await unzipit.unzip(file)
        for (const [name, entry] of Object.entries(entries)) {
    
            console.log(entry)
            const crc =  entry._rawEntry.crc32.toString(16).padStart(8,"0")
            //matches = dat.filter(f=> f[0].crc == crc)
            const matches = games.filter(f=> f.source && f.source[0].file && f.source[0].file[0].$.crc32 == crc ) //NoIntro .json
            console.log(matches)
            if(matches.length > 0)
                taBas.value += `\n${name} bytes: ${entry.size} crc: ${crc}, match: ${matches[0].$.name} `
            else
                taBas.value += `\n${name} bytes: ${entry.size} crc: ${crc}, match: No`
            //taBas.value += `\n${file.name}, ${sha1} `
        }
    }
}

function printMsg(msg)
{
    console.log(msg)
    taBas.value += `${msg}\n`
}

//for unzipit

async function readZipFiles(f) {
    //const arrayBuffer = await f.arrayBuffer()

    if(f.name.toLowerCase().endsWith(".zip")){
        const {name, entries} = await unzipit.unzip(f)
 
        zentries = entries
        selZFiles.options.length = 0
        for (const [name, entry] of Object.entries(entries)) {
            var opt = document.createElement('option')
            opt.value = name
            opt.innerHTML = `${name} bytes: ${entry.size}`
            selZFiles.appendChild(opt)
        }
        if(selZFiles.options.length ==1){
            const arrayBuffer =  new Uint8Array(await zentries[selZFiles.options[0].value].arrayBuffer())
            selZFiles.options.length = 0
            return await readDatFileType(decStr(arrayBuffer))
        }
        selZFiles.style.display = "block"
        selDFiles.style.display = "none"
       
    } else{
        selZFiles.options.length = 0
        //await readFile(f)
    }
}

async function selZFilesOnChange() {
    const arrayBuffer =  new Uint8Array(await zentries[selZFiles.value].arrayBuffer())
    await readDatFileType( decStr(arrayBuffer))
}



//#region checksum
async function CheckSum(arrayBuffer, alg='SHA-1'){
    const hashBuffer = await crypto.subtle.digest(`${alg}`, arrayBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toLowerCase()
}

async function checkSums(buf, types = ['CRC32'])
{
    let cs = {}
    for (const type of types) 
        cs[type.replace('-',"")] = type == 'CRC32' ? crc32(buf).toString(16).padStart(8,"0") : await CheckSum(buf, type)

    cs.size = buf.length
    return cs
}

function crc32(buf) {
    let crc = -1
    for(var i=0, iTop=buf.length; i<iTop; i++) 
        crc =  (crc >>> 8 ) ^ c_table[(crc ^ buf[i]) & 0xff] //buffer
    return (crc ^ (-1)) >>> 0
}

function makeCRCTable(){
  let c, crcTable = []
  for(var n =0; n < 256; n++){
      c = n
      for(var k =0; k < 8; k++)
          c = ((c&1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1))
      crcTable[n] = c >>> 0
  }
  return crcTable
}
//#endregion

}())
