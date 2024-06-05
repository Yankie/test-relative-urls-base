const slugify = require("slugify");
// const eleventyFilterRelativeUrl = require('eleventy-filter-relative-url');
const path = require('path');

function str_title(str) {
    return str ? str.split(" ").map((word) => { 
        return word[0].toUpperCase() + word.substring(1); 
    }).join(" ") : str;
}
var order = 10;

module.exports = {
    layout: "page.njk",
    // permalink: function ({ page }) {
    //     // console.log(page);
    //     // return `/${path.relative('/content/pages', page.filePathStem)}/`;
    //     return `/${path.relative('/content/pages', page.filePathStem)}.${page.outputFileExtension}`;
    // },
    
    // root: (data) => data.eleventy.env.root,
    eleventyComputed: {
        layout: "page.njk",
        eleventyNavigation: {
            key: (data) =>  {
                // console.log("Pages: Key: ", {
                //     pageUrl: data.page.url,
                //     title: data.title,
                //     fileSlug: data.page.fileSlug,
                //     return: data.eleventyNavigation.key || slugify(data.page.url.replace(/\//mg, ' '), {lower: true}) || '__top'
                // });
                return data.eleventyNavigation.key || slugify(data.page.url.replace(/\//mg, ' '), {lower: true}) || '__top'
                // return data.eleventyNavigation.key || data.page.url
            },
            title: (data) => {
                // console.log("Pages: Title: ", {
                //     pageUrl: data.page.url,
                //     title: data.title,
                //     return: data.eleventyNavigation.title || data.title || data.page.url.replace(/\//mg, ' ').trim()
                // });
                return data.eleventyNavigation.title || data.title || str_title(data.page.url.replace(/\//mg, ' ').trim())
            },
            parent: (data) => {
                // console.log(
                //     "Pages: Parent: ", {
                //         title: data.title,
                //         key: data.key,
                //         url: data.page.url,
                //         parent:  data.eleventyNavigation.parent,
                //         url_parent:  slugify(path.dirname(data.page.url).replace(/\//mg, ' '), {lower: true}) || '__top',
                //         url_slugify: slugify(data.page.url.replace(/\//mg, ' '), {lower: true}),
                //         // data: data,
                //         page: data.page,
                //         root: data.page.url === '/',
                //         return: data.page.url === '/' ? '' : ( data.eleventyNavigation.parent || slugify(path.dirname(data.page.url).replace(/\//mg, ' '), {lower: true}) || '__top')
                //     }
                // );
                return data.page.url === '/' ? '' : ( data.eleventyNavigation.parent || slugify(path.dirname(data.page.url).replace(/\//mg, ' '), {lower: true}) || '__top')
            },
            // order: (data) => {
            //     // console.log(
            //     //     "Pages: Parent: ", {
            //     //         order: order,
            //     //         return: data.eleventyNavigation.order || order+10
            //     //     }
            //     // );
            //     order=order+10;
            //     return data.eleventyNavigation.order || order
            // }
        }
    }
};
