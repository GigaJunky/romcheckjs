import * as fs from 'fs'

let cfg = {
    dats: {
        path :  "../../../RetroPie/ROMVault_V3.7.2/"
        ,names: [
            "Atari - Atari 2600 (DB Export) (20250404-023226).xml"
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
        '../../../RetroPie/roms/atari2600/'
        ,"/media/bitjunky/Ventoy/RetroPie/roms/n64/"
        ,"/media/bitjunky/Ventoy/RetroPie/roms/nes/"
        ,'/media/mike/Ventoy/RetroPie/roms/mame-libretro/roms/'
        ,'/media/mike/Ventoy/RetroPie/ROMVault_V3.7.2/RomRoot/Arcade/MAME/mame 0.78 ROMS(listxml)/'
    ]
//    ,checksums: ['crc32','md5','sha1']
}

const rv = matchNoIntroRoms()
fs.writeFileSync("./Atari2600NI.json", JSON.stringify(rv))

function matchNoIntroRoms()
{
    const gson = JSON.parse(fs.readFileSync(`${cfg.dats.path}${cfg.dats.names[0]}.json`).toString())
    const games = gson.datafile.game
    const romscs = JSON.parse(fs.readFileSync(`./romscsp.json`).toString())

    let good = [], bad = []

    for (const r of romscs) {
        const match = games.filter(f=> f.source && f.source[0].file && f.source[0].file[0].$.crc32 == r[0].crc )
        if(match.length > 0)
            good.push(match)
        else
            bad.push(r[0].name, r[0].crc)
    }
    
        console.log("good:", good)
        console.log("bad:", bad)

    return {good, bad}

    for (const g of games) {
        if(g.source && g.source[0].file)
            console.log(g.$.name, g.source[0].file[0].$.crc32)

        //const match = romscs.filter(f=> g.rom[0].$.crc == f.crc)
        //if (match.length> 0)
        //    console.log("dat game:", g.$.name, g.rom[0].$.crc)
    }
}

function matchRoms2a(){
    const gson = JSON.parse(fs.readFileSync(`${cfg.dats.path}${cfg.dats.names[0]}.json`).toString())
    const games = gson.datafile.game

    const romscs = JSON.parse(fs.readFileSync(`./romscsp.json`).toString())[0]
    console.log(romscs[0].crc)

    for (const g of games) {
        const match = romscs.filter(f=> g.rom[0].$.crc == f.crc)
        //if (match.length> 0)
            console.log("dat game:", g.$.name, g.rom[0].$.crc)


    }
    /*
    return
    //console.log(JSON.stringify(games[1].rom[0] ,0,1))

    const romscs = JSON.parse(fs.readFileSync(`./romscs.json`).toString())
    for (const r of romscs) {
        const rcs = r[0].checksums
        console.log(r[0].name, r[0].crc, rcs.crc32, 'crc match:', r[0].crc == rcs.crc32, rcs.md5)

        const match = games.filter(f=> f.rom[0].$.crc == rcs.crc32)
        if(match.length > 0){
            let a = match[0].rom[0].$
            console.log('\tdat match:', a.name, 'md5:', a.md5 == rcs.md5, 'sha1:', a.sha1 == rcs.sha1)
        }
        else console.log('\tNo Match!')
    */
}



function matchRoms(){
    const gson = JSON.parse(fs.readFileSync(`${cfg.dats.path}${cfg.dats.names[2]}.json`).toString())
    const games = gson.datafile.game
    //console.log(JSON.stringify(games[1].rom[0] ,0,1))

    const romscs = JSON.parse(fs.readFileSync(`./romscs.json`).toString())
    for (const r of romscs) {
        const rcs = r[0].checksums
        console.log(r[0].name, r[0].crc, rcs.crc32, 'crc match:', r[0].crc == rcs.crc32, rcs.md5)

        const match = games.filter(f=> f.rom[0].$.crc == rcs.crc32)
        if(match.length > 0){
            let a = match[0].rom[0].$
            console.log('\tdat match:', a.name, 'md5:', a.md5 == rcs.md5, 'sha1:', a.sha1 == rcs.sha1)
        }
        else console.log('\tNo Match!')
    }
}

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
