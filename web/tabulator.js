// #region Tabulator

let table, gamesTable = []
,   dtable, datsTable = []

let cols = "glen,folder,dname,fname,zname,size,zsize,match,crc,crcMatch,md5,sha1,sha1Match".split(",")
let tcolumns = []
for (const c of cols) 
    tcolumns.push ({ field: c, title: c, headerFilter: true, headerMenu: headerMenu  })

console.log("tcol:", tcolumns)


dtable = new Tabulator("#dtable", { movableColumns: true, layout:"fitDataFill", clipboard:true, autoColumns:true, 
    placeholder:"Awaiting Data, Please Load File",
    rowClickPopup:rowPopupFormatter, 
    rowContextMenu: rowMenu,
    pagination:"local",
    paginationSize: 15,
    paginationSizeSelector:[15, 30, 50, 80, 100, 200],
    paginationCounter:"rows"
    , autoColumnsDefinitions:function(definitions){
        for (const c of definitions) {
            c.headerFilter = true
            ,c.headerMenu = headerMenu
        }
        return definitions
    }
})

table = new Tabulator("#table", { movableColumns: true, layout:"fitDataFill", clipboard:true, autoColumns:true, 
    placeholder:"Awaiting Data, Please Load File",
    rowClickPopup:rowPopupFormatter, 
    rowContextMenu: rowMenu,
    pagination:"local",
    paginationSize: 15,
    paginationSizeSelector:[15, 30, 50, 80, 100, 200],
    paginationCounter:"rows",
    //groupBy: "crc",
    //columns: tcolumns

    autoColumnsDefinitions:function(definitions){
        for (const c of definitions) {
            c.headerFilter = true
            ,c.headerMenu = headerMenu
            //c.headerVertical = true
        }
        return definitions
    }

})

var rowPopupFormatter = function(e, row, onRendered){
    var data = row.getData(),
    container = document.createElement("div"),
    contents = "<strong style='font-size:1.2em;'>Row Details</strong><br/><ul style='padding:0;  margin-top:10px; margin-bottom:0;'>"
    contents += "<li><strong>Name:</strong> " + data.name + "</li>"
    contents += "<li><strong>sha1:</strong> " + data.sha1 + "</li>"
    contents += "<li><strong>md5:</strong> " + data.md5 + "</li>"
    contents += "</ul>"

    container.innerHTML = contents

    return container
}

//create header popup contents
var headerPopupFormatter = function(e, column, onRendered){
    var container = document.createElement("div")

    var label = document.createElement("label")
    label.innerHTML = "Filter Column:"
    label.style.display = "block"
    label.style.fontSize = ".7em"

    var input = document.createElement("input")
    input.placeholder = "Filter Column..."
    input.value = column.getHeaderFilterValue() || ""

    input.addEventListener("keyup", (e) => {
        column.setHeaderFilterValue(input.value)
    })

    container.appendChild(label)
    container.appendChild(input)

    return container
}

//create dummy header filter to allow popup to filter
var emptyHeaderFilter = function(){ return document.createElement("div") }

var rowMenu = [
    {
        label:"<i class='fas fa-user'></i> Change Name",
        action:function(e, row){ row.update({name:"Steve Bobberson"}) }
    }
    ,{
        label:"<i class='fas fa-check-square'></i> Select Row",
        action:function(e, row){ row.select() }
    }
    ,{ separator:true }
    ,{ label:"Print", action:function(e, row){ table.print(false, true) }} 

    ,{
        label:"Admin Functions",
        menu:[
            {
                label:"<i class='fas fa-trash'></i> Delete Row",
                action:function(e, row){ row.delete() }
            },
            {
                label:"<i class='fas fa-ban'></i> Disabled Option",
                disabled:true,
            },
        ]
    }
    ,
    { separator:true },
    
    {
        label:"Download",
        menu:[
             { label:"CSV"  , action:function(e, row){ table.download("csv", "data.csv") }}
            ,{ label:"JSON" , action:function(e, row){ table.download("json", "data.json") }} 
            ,{ label:"HTML" , action:function(e, row){ table.download("html", "data.html", {style:true}) }} 
            ,{ label:"PDF"  , action:function(e, row){ table.download("pdf", "data.pdf", { orientation:"portrait", title:"Example Report" }) }} 
            ,{ label:"xlsx" , action:function(e, row){ table.download("xlsx", "data.xlsx", {sheetName:"My Data"}) }} 
        ]
    }
]

//trigger an alert message when the row is clicked
table.on("rowClick", function(e, row){
    let rd = row.getData() 
    console.log("Row " + rd.crc + " Clicked!!!!")
    dtable.setFilter("crc", "=", rd.crc)
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
window.addEventListener("keydown", (e) => {
    console.log(`Key "${e.key}" pressed [event: keydown]  ${table.getPage()}`)
    if(e.shiftKey)
        if(e.key === 'PageDown') table.nextPage()
        else if (e.key === 'PageUp')  table.previousPage()
        else if (e.key === 'Home')  table.setPage(1)
        else if (e.key === 'End')  table.setPage("last")
  })

//define column header menu as column visibility toggle
    var headerMenu = function () {
        var menu = []
        var columns = this.getColumns()

        for (let column of columns) {

            //create checkbox element using font awesome icons
            let icon = document.createElement("i")
            icon.classList.add("fas")
            icon.classList.add(column.isVisible() ? "fa-check-square" : "fa-square")

            //build label
            let label = document.createElement("span")
            let title = document.createElement("span")

            title.textContent = " " + column.getDefinition().title

            label.appendChild(icon)
            label.appendChild(title)

            //create menu item
            menu.push({
                label: label,
                action: function (e) {
                    //prevent menu closing
                    e.stopPropagation()

                    //toggle current column visibility
                    column.toggle()

                    //change menu item icon
                    if (column.isVisible()) {
                        icon.classList.remove("fa-square")
                        icon.classList.add("fa-check-square")
                    } else {
                        icon.classList.remove("fa-check-square")
                        icon.classList.add("fa-square")
                    }
                }
            })
        }

        return menu
    }
//#endregion