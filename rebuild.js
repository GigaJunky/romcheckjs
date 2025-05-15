import AdmZip from "adm-zip"
import * as os from 'os'
import * as fs from 'fs'

let cfg = {
    linux: {
        roms: "/media/bitjunky/Ventoy/RetroPie/roms/mame-libretro/roms/",
        dats: "/media/bitjunky/Ventoy/RetroPie/ROMVault_V3.7.2/DatRoot/Arcade/MAME/listxml/"
    },
    win32: {
        romsx: "I:/RetroPie/roms/mame-libretro/roms/",
        roms: "I:/RetroPie/roms/mame-libretro-mix/",
        dats: "I:/RetroPie/ROMVault_V3.7.2/DatRoot/Arcade/MAME/listxml/",
        out: "J:/share/emu/mame/{mamebuild}/roms/"
    }
}

cfg = cfg[os.platform()]

const zfi = readZipFiles(process.argv[2])
//console.log(zfi)
readAllMameDatFiles(zfi)

//--------

function readZipFiles(zipfilename) {
    console.log("readZipFiles", cfg.roms + zipfilename + ".zip" )
    const zip = new AdmZip(cfg.roms + zipfilename + ".zip")
    let zfs = []

    for (const z of zip.getEntries()) {
        console.log(z.name, z.header.crc.toString(16).padStart(8, '0'), z.header.size, z.header.time)
        zfs.push({ name: z.name, size: z.header.size, crc: z.header.crc.toString(16).padStart(8, '0'), date: z.header.time })
    }
    return { zipfilename: zipfilename + ".zip", files: zfs }
}

function readAllMameDatFiles(zfi) {
    let jDats = fs.readdirSync(cfg.dats).filter(f => f.endsWith(".json"))
    for (const fn of jDats) {
        let jDat = JSON.parse(fs.readFileSync(cfg.dats + fn).toString())
        jDat.filename = fn.replace(".xml.json", "")
        console.log(fn)
        readMameDatFile(jDat, zfi)
    }
}

function readMameDatFile(jDat, zfi) {
    //mame 0.78 mame.game.rom
    //mame 0.139 mame.game.rom
    //mame 0.276 mame.machine.rom
    console.log(jDat.mame.$)
    let games = jDat.mame.machine ? jDat.mame.machine : jDat.mame.game
    for (const game of games) {
        //console.log(`${game.$.name} ${game.description} ${game.year} ${game.manufacturer} ${game.rom ? game.rom.length: 0}`)
        let crc = zfi.files[0].crc
        if (game.rom && Array.isArray(game.rom))
            for (const r of game.rom) {
                if (r.$.crc == crc) {
                    //console.log(`found! r: ${r.$.name} ${r.$.size} ${r.$.crc} ${r.$.sha1}`)
                    //console.log("counts: ", zfi.files.length, game.rom.length)
                    //console.log( game.$)
                    let rs = analyzeRomSet(zfi, game)
                    rs.filename = jDat.filename
                    //console.log(rs)
                    rebuildRomSet(rs)
                    return
                }
                //datsTable.push({glen: games.length, zname: undefined, zsize: undefined, name: game.$.name, rname: r.$.name, match: 0, size: r.$.size, crc: r.$.crc, crcMatch: undefined, sha1: r.$.sha1, sha1Match: undefined , description: game.description })
            }
    }
    console.log("Done")
}

function analyzeRomSet(zfi, gi) {
    console.log(gi.$)
    let rs = { zipname: zfi.zipfilename, crcmatch: 0, filecount: gi.rom.length, files: [] }

    for (const r of gi.rom) {
        let i = zfi.files.find(f => f.crc == r.$.crc)
        //console.log(r.$.name, r.$.size, r.$.crc, r.$.sha1)
        if (i) {
            rs.crcmatch++
            //if (i.name != r.$.name) console.log(`rename ${i.name} to ${r.$.name}`)
            //else console.log(`${i.name} ok`)
            rs.files.push({ rename: i.name != r.$.name, from: i.name, to: r.$.name })
        }
        else console.log(`missing ${r.$.name}  ${r.$.crc} `)
    }
    //console.log(`${rs.crcmatch}/${rs.filecount}`)
    return rs
}

function rebuildRomSet(rs)
{
    if(rs.crcmatch != rs.filecount) return
    console.log("rebuildRomSet:", rs)
    var iz = new AdmZip(cfg.roms + rs.zipname)
    iz.extractAllTo("c:/temp/zipcontents", true)
    let ozfn = cfg.out.replace("{mamebuild}", rs.filename) + rs.zipname
    console.log("ozfn: ", ozfn)
    var oz = new AdmZip()
    for (const f of rs.files) {
        console.log(f)
        oz.addFile(f.from, fs.readFileSync(`c:/temp/zipcontents/${f.from}`) );
    }
    oz.writeZip(ozfn)
    //fs.rmSync("c:/temp/zipcontents", { recursive: true })

}

