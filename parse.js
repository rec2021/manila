'use strict';

module.exports = function(template) {

    return new Function('context',

        "var p=[];with(context){p.push(`" +
       
        template
        	.replace(/\\'/g, "\\\\'")
            .replace(/`/g, "\\`")
            .replace(/<<<(?!\s*}.*?>>>)(?!.*{\s*>>>)(.*?)>>>/g, "`,(typeof $1==='undefined'?'':$1),`")
            .replace(/<<<\s*(.*?)\s*>>>/g, "`);$1\np.push(`")
            .replace(/<<(?!\s*}.*?>>)(?!.*{\s*>>)(.*?)>>/g, "`,(typeof $1==='undefined'?'':_e_($1)),`")
            .replace(/<<\s*(.*?)\s*>>/g, "`);$1\np.push(`")

      + "`);}return p.join('');");
};