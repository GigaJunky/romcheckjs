import * as fs from 'fs'
import * as xml2js from 'xml2js'


saveXML2Json(process.argv[2])

function saveXML2Json(fn)
{
    const sfn = `${fn}.json`
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
