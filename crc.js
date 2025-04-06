const crc_table = makeCRCTable()
//console.log(crc_table)
console.log(crc32("THIS IS  A TEST"))


function crc32 (str) {
    let crc = -1
    for(var i=0, iTop=str.length; i<iTop; i++) 
        crc = ( crc >>> 8 ) ^ crc_table[( crc ^ str.charCodeAt( i ) ) & 0xFF]
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