//const AdmZip = require("adm-zip")
//,os = require('os')
import AdmZip from "adm-zip"
import * as os from 'os'

let cfg = {
    linux: {
        roms: "/media/bitjunky/Ventoy/RetroPie/roms/mame-libretro/roms/",
        dats: "/media/bitjunky/Ventoy/RetroPie/ROMVault_V3.7.2/DatRoot/Arcade/MAME/listxml/"
    },
    win32: {
        roms: "I:/RetroPie/roms/mame-libretro/roms/",
        dats: "I:/RetroPie/ROMVault_V3.7.2/DatRoot/Arcade/MAME/listxml/"
    }
}

cfg = cfg[os.platform()]

const fn = `${cfg.roms}${process.argv[2]}.zip`
console.log(fn)

var zip = new AdmZip(fn)

for (const z of zip.getEntries()) 
    console.log(z.name, z.header.crc.toString(16).padStart(8,'0'), z.header.size, z.header.time)

zip.extractAllTo("c:/temp/zipcontent/", true)
