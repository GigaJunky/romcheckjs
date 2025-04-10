import {unzip} from 'unzipit'
import * as fsPromises from 'node:fs/promises'

import * as fs from 'fs'
import * as xml2js from 'xml2js'
import * as crypto from 'crypto'
import * as path from 'path'
import { time, timeEnd } from 'node:console'

const crc_table = makeCRCTable()
let rom = process.argv[2]
console.log(rom)

let cfg = {
    dats: {
        path :  "../../../RetroPie/ROMVault_V3.7.2/"
        ,names: [
            "Atari - Atari 2600 (DB Export) (20250404-023226).xml"
            ,"Nintendo - Nintendo 64 (DB Export) (20250329-063244).xml",
            ,"Nintendo - Nintendo 64 (ByteSwapped) (20250329-063244).dat"
            ,"Nintendo - Nintendo 64 (BigEndian) (20250329-063244).dat"
            ,"Nintendo Famicom & Entertainment System - Games - [NES] (TOSEC-v2025-01-15_CM).dat"
            ,"Atari 2600 & VCS - Games (TOSEC-v2025-01-15_CM).dat"
            ,"fixDat_Arcade_MAME_MAME 0.276 ROMs (listxml).dat"
            ,"MAME 0.276 ROMs (listxml).dat"
            ,"fixDat_Arcade_MAME_mame078.dat"
        ]
    },
    roms: [
        "/media/bitjunky/Ventoy/RetroPie/roms/n64/",
        "/media/bitjunky/Ventoy/RetroPie/roms/nes/"
        ,"/media/bitjunky/Ventoy/RetroPie/roms/atari2600/"
        ,'/media/mike/Ventoy/RetroPie/roms/mame-libretro/roms/'
        ,'/media/mike/Ventoy/RetroPie/ROMVault_V3.7.2/RomRoot/Arcade/MAME/mame 0.78 ROMS(listxml)/'
    ]
//    ,checksums: ['crc32','md5','sha1']
}

console.log("dat file:", cfg.dats.names[0])
console.log("rom file:", cfg.roms[0].$)

let gson = await saveXML2Json()
console.log(gson)
if (!gson) gson = JSON.parse(fs.readFileSync(`${cfg.dats.path}${cfg.dats.names[0]}.json`).toString())

await checkAllRoms2()

process.exit()

if(rom) await checkRom(rom)
else    await checkAllRoms()

async function FindByCrc(rom)
{
    const zfi = await readZipFiles(cfg.roms[0] + rom)
    , ri = (gson.datafile.game.filter(f=> f.rom[0].$.crc == zfi[0].crc))
    return {zfi, ri}
    //console.log(JSON.stringify( {zfi, ri}, 0, 1))
    /*
    console.log(rom, 'zfi:', zfi[0].name, zfi[0].size, zfi[0].crc)

    if(ri.length < 1) console.log('ri not found!')
    else
    console.log('ri:', ri[0].rom[0].$.name, ri[0].rom[0].$.md5 )
    */
}
    //console.log(JSON.stringify(ri,0,1))
    //console.log(gson.datafile.game[1].rom[0].$)
    //console.log(JSON.stringify(gson.datafile.game[1], null, 2))
    //console.log(gson.datafile.game.filter(f=> f.$.name.toLowerCase().includes('defender')))
    //let f = gson.datafile.game.filter(f=> f.rom[0].$.name.toLowerCase().includes('berzerk')) //rom name
    //for (const r of f) console.log(BigInt("0x" + r.rom[0].$.crc).toString(10))
    //console.log(JSON.stringify(f, 0, 1))

async function checkAllRoms2()
{
    console.time('checkAllRoms2')

    const roms = fs.readdirSync(cfg.roms[0])
    let good = []
    let bad = []

    for (const rom of roms) {
        if(rom.endsWith('.zip')){
            const ri =  await FindByCrc(rom)
            //console.log(ri.ri[0])

            if(ri.ri.length > 0){
                good.push(ri)
                //good.push(rom + ',' + ri.ri[0].rom[0].$.name)
                //console.log(ri.ri[0].rom[0].$.name)

            } 
            else{
                bad.push(ri)
                //bad.push(rom + ',' + ri.zfi[0].crc ) 
                //console.log(ri)
            }
        }   
    }

    fs.writeFileSync(`${cfg.dats.path}GoodBadRoms.json`, JSON.stringify( {good, bad}))

    console.log('GOOD:', good.length)
    console.log(good)

    console.log('BAD', bad.length)
    console.log(bad)
    console.timeEnd('checkAllRoms2')

}

async function checkAllRoms()
{
    const roms = fs.readdirSync(cfg.roms[0])
    let good = []
    let bad = []

    for (const rom of roms) {
        //console.log(rom)
        const ok = await checkRom(path.parse(rom).name)
        if(ok) good.push(rom)
        else bad.push(rom)
    }
    console.log('GOOD:', good.length)
    console.log(good)

    console.log('BAD', bad.length)
    console.log(bad)

}

async function checkRom(rom)
{
    const ri = getRomInfo(rom)
    if(!ri) return
    const zfi = await readZipFiles(cfg.roms[0] + rom + '.zip')
    //console.log(ri)
    console.log(zfi)
    //console.log(zfi.length, ri.length)
    let goodCount=0
    for (const r of ri) {
        const z = zfi.find(f=> f.name == r.name)
        //if(!z) console.log(r.name, 'not found!')
        if(z){
            //console.log(r.name, r.crc == z.crc, r.size == z.size )
            if(r.crc == z.crc && r.size == z.size) goodCount++
        }
    }

    console.log('checkRom:', rom, goodCount, ri.length, goodCount == ri.length)

    return goodCount == ri.length
}

function getRomInfo(rom)
{
    const i = gson.datafile.game.findIndex(x => x.$.name === rom)
    if(i <0){
        console.log('getRomInfo not found!: ', rom)
        return
    }
    console.log("getRomInfo:", gson.datafile.game.length, rom, i)
    let g = gson.datafile.game[i]
    console.log(i, g.$.name, g.description, g.year, g.manufacturer)
    let ri = []
    for (const r of g.rom) {
        const fn = `${g.$.name}/${r.$.name}`
        /* let sha1 = false
        if(fs.existsSync(fn) && fs.statSync(fn).size == r.$.size)
            sha1 = sha1FileSync(fn) == r.$.sha1  */
        //console.log(r.$.name, r.$.size, r.$.crc, r.$.sha1 )
        ri.push({name: r.$.name, size: r.$.size, crc: r.$.crc, sha1: r.$.sha1 })
    }
    return ri
}

function saveXML2Json()
{
    const fn = `${cfg.dats.path}${cfg.dats.names[0]}`
        , sfn = `${fn}.json`
    console.log('saveXML2Json:', fn)
    if(!fs.existsSync(sfn)){
        const xml = fs.readFileSync(fn).toString()
        xml2js.parseStringPromise(xml /*, options */).then(function (result) {
            console.log('saveXML2Json:', sfn)
            fs.writeFileSync(sfn, JSON.stringify(result))
            return result
          })
          .catch(function (err) {
            console.log('xml2json error!', err)
          })
    }
}


//un compress
async function readZipFiles(filename)
{
    const buf = await fsPromises.readFile(filename)
    const {zip, entries} = await unzip(new Uint8Array(buf))
    //console.log("readZipFiles:", filename)
    let zfi = [], arrayBuffer
    for (const e of Object.keys(entries)) {
        //console.log(e, entries[e].size, entries[e]._rawEntry.crc32)

        if(cfg.checksums != undefined)
            arrayBuffer = await entries[e].arrayBuffer()
        
        let i = { name: e, size: entries[e].size ,
             crc: entries[e]._rawEntry.crc32.toString(16).padStart(8,"0")
        }
        if(cfg.checksums != undefined)
            i.checksums = checkSums(Buffer.from(arrayBuffer), cfg.checksums)

        zfi.push(i)
  

    }
    return zfi
}


//checksums
function fileCheckSums(filePath, types) { return checkSums(fs.readFileSync(filePath), types )}

function checkSums(buf, types = ['crc32'])
{
    let cs = { size: buf.length }
    for (const type of types) 
        cs[type] = type == 'crc32' ? crc32(buf).toString(16) :  crypto.createHash(type).update(buf).digest("hex")
    return cs
}

function crc32(buf) {
    let crc = -1
    for(var i=0, iTop=buf.length; i<iTop; i++) 
        crc =  (crc >>> 8 ) ^ crc_table[(crc ^ buf[i]) & 0xff] //buffer
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
