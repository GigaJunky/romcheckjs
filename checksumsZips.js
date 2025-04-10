import {unzip} from 'unzipit'
import * as fsPromises from 'node:fs/promises'
import * as crypto from 'crypto'
import * as fs from 'fs'
import {EOL} from 'os'

const c_table = makeCRCTable()
, cfg = {checksums: ['md5','sha1','crc32'] }

const rompath = process.argv[2]
, list = await checksumRoms()

//fs.writeFileSync('./romscs.json', JSON.stringify(list)) //raw json hard to read

//preaty json, 1 obj per line for ez reading of text file
let filename = './romscsp.json'
if (fs.existsSync(filename)) fs.unlinkSync(filename)
fs.appendFileSync(filename, '[' + EOL )
for (let i = 0; i < list.length -1; i++) 
    fs.appendFileSync(filename, JSON.stringify(list[i]) + ','  + EOL ) 
fs.appendFileSync(filename, JSON.stringify(list[list.length-1]) + EOL +  ']' + EOL ) 

//csv
filename = './romscs.csv'
if (fs.existsSync(filename)) fs.unlinkSync(filename)
fs.appendFileSync(filename, objectToArrayHeader(list[0][0]).join(';') + EOL ) 
for (const rc of list)
    fs.appendFileSync(filename, objectToArray(rc[0]).join(';') + EOL ) 

function objectToArray(o)
{
    let a = []
    const keys  = Object.keys(o)
    for (const k of keys)
        if(typeof o[k] != 'object')
            a.push(o[k])
        else
            a = a.concat(objectToArray(o[k]))
    return a
}

function objectToArrayHeader(o)
{
    let a = []
    const keys  = Object.keys(o)
    for (const k of keys)
        if(typeof o[k] != 'object')
            a.push(k)
        else
            a = a.concat(objectToArrayHeader(o[k]))
    return a
}

async function checksumRoms()
{
    const roms = fs.readdirSync(rompath)
    let list = []

    for (const rom of roms) {
        if(rom.endsWith(".zip")){
            const zi = await readZipFiles(rompath + rom)
            list.push(zi)
        }
    }
    return list
}

async function readZipFiles(filename)
{
    const 
     buf = await fsPromises.readFile(filename)
    , {zip, entries} = await unzip(new Uint8Array(buf))

    //console.log("readZipFiles:", filename) //, fs.statSync(filename))
    let zfi = [], arrayBuffer
    for (const e of Object.keys(entries)) {
        //console.log(e, entries[e].size, entries[e]._rawEntry.crc32)

        let i = { }

        if(cfg.checksums != undefined){
            arrayBuffer = await entries[e].arrayBuffer()
            i.checksums = checkSums(Buffer.from(arrayBuffer), cfg.checksums)
        }

        i.crc =  entries[e]._rawEntry.crc32.toString(16).padStart(8,"0")
        i.size = entries[e].size 
        i.name = e //name is last as it is most varible length to help preaty json 

        zfi.push(i)
    }
    return zfi
}

function fileCheckSums(filePath, types) { return checkSums(fs.readFileSync(filePath), types )}

function checkSums(buf, types = ['crc32'])
{
    let cs = {}
    for (const type of types) 
        cs[type] = type == 'crc32' ? crc32(buf).toString(16).padStart(8,"0") :  crypto.createHash(type).update(buf).digest("hex")

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
