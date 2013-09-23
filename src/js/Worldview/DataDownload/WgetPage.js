/*
 * NASA Worldview
 * 
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project. 
 *
 * Copyright (C) 2013 United States Government as represented by the 
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 */
Worldview.namespace("DataDownload");

Worldview.DataDownload.WgetPage = (function() {
    
    var ns = {};
    
    ns.show = function(selection) {
        var text = window.open('', 'Worldview_' + new Date());
        text.document.write("<html>");
        writeHeader(text.document);
        writePreamble(text.document);
        $.each(selection, function(key, product) { 
            writeProduct(text.document, product);

        });
        text.document.write("</div></body></html>");
        text.document.close();
    };
    
    var writeHeader = function(doc) {
        doc.write(
            "<header>" + 
            "<title>wget.html</title>" +
            
            "<style>" + 
                "body { " + 
                    "background-color: rgb(25, 28, 32);" + 
                "}" + 
                "h3 { " +
                    "margin-top: 0;" +
                "}" + 
                "h4 { " +
                    "margin-bottom: 0;" +
                "}" + 
                "#page { " + 
                    "background-color: #ffffff;" +
                    "margin: 20px; " +
                    "padding: 20px; " + 
                    "border-radius: 5px; " +  
                "}" +    
                "pre {" + 
                    "background-color: #eeeeee;" +
                    "padding: 5px;" + 
                    "border: 1px dashed #dddddd;" +
                "}" +
                ".label {" +
                    "margin-top: 10px; " +
                    "font-style: italic;" +
                    "color: #808080;" +
                "}" +
            "</style>" + 
            "</header>"
        );    
    };
    
    var writePreamble = function(doc) {
        doc.write(
            "<body>" + 
            "<div id='page'>" +
            "<div id='instructions'>" + 
                "<h3>Using <code>wget</code> to Bulk Download Your Data</h3>" + 
                "1) Save this HTML page as <code>wget.html</code> to your " + 
                "local computer.<br>" + 
                "2) Execute the following command to download all of your " +
                "requested files:" + 
                "<pre>" + 
                    "wget --input-file=wget.html --force-html" + 
                "</pre><br>" +
                "<b>Note</b>: if User Registration System (URS) credentials are required, " +
                "create a file (only readable by you) called " + 
                "<code>urs.credentials</code> with the following:" +
                "<pre>" + 
                    "user=<i>urs_user</i>\n" +
                    "password=<i>urs_password</i>" +
                "</pre>" +
                "where <i>urs_user</i> is your URS user name and " +
                "<i>urs_password</i> is your URS password. To download, "+
                "use the following command instead of step 2 above:" +
                "<pre>" +
                     "wget --input-file=wget.html --force-html --config=urs.credentials" +
                 "</pre><br>" +  
            "</div>" 
        );    
    };
    
    var writeProduct = function(doc, product) {
        console.log(product);
        doc.write("<h4>" + product.name + "</h4>");
        if ( product.noBulkDownload ) {
            doc.write("<p>" +
                      "These granules are not available for bulk download. " + 
                      "Please visit each link and download manually." + 
                      "</p>");
        }
        $.each(product.list, function(index, item) { 
            // Don't print twice if the item and product names are the same.
            if ( item.label !== product.name ) {
                doc.write("<div class='label'>" + item.label + "</div>");
            }
            $.each(item.links, function(index, link) {
                if ( !product.noBulkDownload ) {
                    doc.write(
                        "<div>" +
                        "<a href='" + link.href + "'>" + link.href + "</a>" +
                        "</div>"
                    );
                } else {
                    doc.write(
                        "<div class='label'>" + 
                        link.href +
                        "</div>"
                    );
                }
            });
        });                
    };
        
    return ns;
    
})();
