        (async function() {

            const Audio = document.getElementById("Audio")
            , fileInput = document.getElementById("file-input")
            , datfileInput = document.getElementById("datfile-input")
            , btnSaveWav = document.getElementById("btnSaveWav")
            , btnSaveCas = document.getElementById("btnSaveCas")
            , selZFiles = document.getElementById("selZFiles")
            , selDFiles = document.getElementById("selDFiles")
            , FileCS = document.getElementById("FileCS")
            , CasCS = document.getElementById("CasCS")
            , WavCS = document.getElementById("WavCS")
            , taBas = document.getElementById("taBas")
            , lblCount = document.getElementById("lblCount")

            btnSaveWav.onclick = Download
            btnSaveCas.onclick = Download
            fileInput.onchange = readFilesCStext // readFilesCSJson //readZipFiles //readFile
            datfileInput.onchange = readDatFiles //readZipFiles //readFile
            selZFiles.ondblclick = selZFilesOnChange
            selDFiles.ondblclick = selDFilesOnChange

            const enc = new TextDecoder("utf-8")
            function encStr(s) { return new TextEncoder("utf-8").encode(s) }
            function decStr(b) { return new TextDecoder("utf-8").decode(b) }

            let zentries, dir, dskbuf, cas, cocoCasWave, dat, datText, table, gamesTable = []

            table = new Tabulator("#table", { movableColumns: true, layout:"fitDataFill", clipboard:true, autoColumns:true, 
                autoColumnsDefinitions:function(definitions){
                  for (const c of definitions) {
                    c.headerFilter = true
                    //c.headerVertical = true
                  }
                  return definitions
                }
              })
            
            
            //trigger an alert message when the row is clicked
            table.on("rowClick", function(e, row){ 
               alert("Row " + row.getData().id + " Clicked!!!!");
            })
            table.on("dataLoaded", function(data){
                console.log("dataLoaded:",  data.length)
                lblCount.innerHTML = data.length
            })
            table.on("dataFiltered", function(filters, rows){
                //filters - array of filters currently applied
                //rows - array of row components that pass the filters
                lblCount.innerHTML = rows.length
            })
          

             //NoIntro DB
            async function readDatFiles(event)
            {
                const file = event.target.files[0]
                const arrayBuffer = await file.arrayBuffer()
                datText =  decStr(arrayBuffer)
                const jDat = JSON.parse(datText)
                gamesTable = []
                for (const g of jDat.datafile.game) {
                    if(g.source)
                        for (const gs of g.source) 
                            if(gs.file)
                                for (const gsf of gs.file) {
                                    //console.log(g.$.name, gsf.$.crc32 )
                                    if(!gamesTable.some( i => i.crc == gsf.$.crc32))
                                        gamesTable.push({name: g.$.name, match: 0, size: gsf.$.size, crc: gsf.$.crc32, md5: gsf.$.md5, sh1: gsf.$.sha1, bad: gsf.$.bad, region: g.archive[0].$.region })
                                }
                }
                table.setData(gamesTable)
            }

            async function readFilesCStext(f)
            {
                console.log('f:', dat)
                //const games = dat.datafile.game
                //console.log(games.length)

                for (const file of fileInput.files) {
                    const arrayBuffer = await file.arrayBuffer()
                    //const sha1 = await SHAbuf(arrayBuffer)
                    const {entries} = await unzipit.unzip(file)
                    for (const [name, entry] of Object.entries(entries)) {
                        //console.log(entry)
                        const crc =  entry._rawEntry.crc32.toString(16).padStart(8,"0")
                        //matches = dat.filter(f=> f[0].crc == crc)
                        //const matches = games.filter(f=> f.source && f.source[0].file && f.source[0].file[0].$.crc32 == crc ) //NoIntro .json
                        //const matches = gamesTable.filter(f=> f.crc == crc ) //NoIntro .json
                        let fi = gamesTable.findIndex(i => i.crc == crc)
                        if(fi >=0)
                            gamesTable[fi].match = 1
                        else
                            gamesTable.push({name: file.name, match: -1, crc: crc })

                        taBas.value += `\n${name} bytes: ${entry.size} crc: ${crc}, match: ${fi} `
                    }
                }
                table.setData(gamesTable)   
            }


            async function readFilesCSJson(f)
            {
                console.log('f:', dat)
                const games = dat.datafile.game
                console.log(games.length)

                for (const file of fileInput.files) {
                    const arrayBuffer = await file.arrayBuffer()
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
                        //taBas.value += `\n${file.name}, ${sha1} `;
                    }
                }
            }

            async function readFile(f) {
                const arrayBuffer = await f.arrayBuffer()
                FileCS.innerText = await SHAbuf(arrayBuffer)

                console.log("readFile:", f)
                
                if(f.name.toLowerCase().endsWith(".dsk")){
                    return listDskFiles(arrayBuffer)
                    //cocoCasWave = createAudioCoCo(convertDatatoCas(arrayBuffer))
                }else
                if(f.name.toLowerCase().endsWith(".p"))
                    cocoCasWave = createAudioZX81(arrayBuffer)
                else
                    cocoCasWave = createAudioCoCo(arrayBuffer)
                
                Audio.src = URL.createObjectURL(new Blob([cocoCasWave], { type: 'audio/wav' }))
                WavCS.innerText = await SHAbuf(cocoCasWave)
            }
        
            async function SHAbuf(arrayBuffer, alg=1){
                const hashBuffer = await crypto.subtle.digest(`SHA-${alg}`, arrayBuffer)
                const hashArray = Array.from(new Uint8Array(hashBuffer))
                return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase()
            }
            //for unzipit
            async function readZipFiles() {
                const f = fileInput.files[0]
                const arrayBuffer = await f.arrayBuffer()
                FileCS.innerText =  await SHAbuf(arrayBuffer)
                CasCS.innerText =  ""
                WavCS.innerText =  ""
                selZFiles.style.display = "block"
                selDFiles.style.display = "none"
        
                if(f.name.toLowerCase().endsWith(".zip")){
                    const {entries} = await unzipit.unzip(f)
                    zentries = entries
                    selZFiles.options.length = 0
                    for (const [name, entry] of Object.entries(zentries)) {
                        var opt = document.createElement('option')
                        opt.value = name
                        opt.innerHTML = `${name} bytes: ${entry.size}`
                        selZFiles.appendChild(opt)
                    }
                } else{
                    selZFiles.options.length = 0
                    await readFile(f)
                }
            }
        
            async function selZFilesOnChange() {
                selDFiles.style.display = "none"
                const arrayBuffer =  new Uint8Array(await zentries[selZFiles.value].arrayBuffer())
                CasCS.innerText = await SHAbuf(arrayBuffer)

                if(selZFiles.value.toLowerCase().endsWith(".dsk")){
                    return listDskFiles(arrayBuffer)
                    //cocoCasWave = createAudioCoCo(convertDatatoCas(arrayBuffer))
                }else
                if(selZFiles.value.toLowerCase().endsWith(".p"))
                    cocoCasWave = createAudioZX81(arrayBuffer)
                else
                    cocoCasWave = createAudioCoCo(arrayBuffer)
        
                Audio.src = URL.createObjectURL(new Blob([cocoCasWave], { type: 'audio/wav' }))
                WavCS.innerText = await SHAbuf(cocoCasWave)
            }

            async function selDFilesOnChange() {
                console.log("selDFilesOnChange", selZFiles.value, selDFiles.value)

                //console.log("selDFilesOnChange ze:", dir, zentries)
                const selDFile = dir.find( f => `${f.name}.${f.ext}` === selDFiles.value )
                const zfbuf =  dskbuf//new Uint8Array(await zentries[selZFiles.value].arrayBuffer())
                const ext = selDFile.ext
                //if(ext == "BAS" || ext == "TXT" || ext == "DOC"){
                    //console.log("bas:", selDFiles.value, zfbuf.length, selDFile, ext)
                    const dd = getDskFileData(zfbuf, selDFile)
                    taBas.value = ext === "BAS" ? basDeTok(dd) : decStr(dd)
                //}

                console.log("selDFile:", dir, selDFile)
                cas = convertDatatoCas(zfbuf, selDFile.i)
                CasCS.innerText = await SHAbuf(cas)

                cocoCasWave = createAudioCoCo(cas)
                Audio.src = URL.createObjectURL(new Blob([cocoCasWave], { type: 'audio/wav' }))
                WavCS.innerText = await SHAbuf(cocoCasWave)
            }

            function listDskFiles(d){
                selDFiles.options.length = 0
                selDFiles.style.display = "block"

                dskbuf = new Uint8Array(d)
                dir = getDirectory(dskbuf)
                for (const e of dir) {
                    var opt = document.createElement('option')
                    opt.value = `${e.name}.${e.ext}` 
                    opt.innerHTML = `${opt.value} bytes: ${e.size} ascii: ${e.ascii} type: ${e.type}`
                    selDFiles.appendChild(opt)
                }
            }

            function Download(e) {
                var saveByteArray = (function () {
                var a = document.createElement("a")
                a.style = 'display: none'
                document.body.appendChild(a)
                return function (data, name) {
                    var blob = new Blob([data], {type: "application/octet-stream"}),
                        url = window.URL.createObjectURL(blob)
                    a.href = url
                    a.download = name
                    a.click()
                    a.remove()
                    window.URL.revokeObjectURL(url)
                }
                }())
                console.log(e.target.id)
                if(e.target.id === "btnSaveWav")
                    saveByteArray(cocoCasWave, 'out.wav')
                else 
                    saveByteArray(cas, 'out.cas')
            }
        }())
