'use strict';

module.exports = function(template) {

    return new Function('context',

        "var p=[];with(context){p.push(`" +
       
        template
            .replace(/\\'/g, "\\\\'")
            .replace(/`/g, "\\`")
            .replace(/<::(?!\s*}.*?::>)(?!.*{\s*::>)(.*?)::>/g, "`);try{p.push($1)}catch(e){}p.push(`")
            .replace(/<::\s*(.*?)\s*::>/g, "`);$1\np.push(`")
            .replace(/<:(?!\s*}.*?:>)(?!.*{\s*:>)(.*?):>/g, "`);try{p.push(manila.e($1))}catch(e){}p.push(`")
            .replace(/<:\s*(.*?)\s*:>/g, "`);$1\np.push(`")

      + "`);}return p.join('');");
};