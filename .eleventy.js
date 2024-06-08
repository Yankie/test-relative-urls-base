const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");
// const eleventyFilterRelativeUrl = require('eleventy-filter-relative-url');
const eleventyPluginTOC = require('eleventy-plugin-toc');
const directoryOutputPlugin = require("@11ty/eleventy-plugin-directory-output");
const posthtml = require('posthtml');
const urls = require('posthtml-urls');
const path = require('node:path');

module.exports = function(eleventyConfig) {
  eleventyConfig.setDataDeepMerge(true);

  eleventyConfig.addWatchTarget("./src/_assets/")
  eleventyConfig.addPassthroughCopy({"./src/_assets/":"/assets"})
  eleventyConfig.addWatchTarget("./src/content/media/")
  eleventyConfig.addPassthroughCopy({"./src/content/media/":"/media"})

  // Filter to make all paths relative
  // eleventyConfig.addFilter('url', eleventyFilterRelativeUrl);

  eleventyConfig.addPlugin(eleventyNavigationPlugin);
  eleventyConfig.addPlugin(eleventyPluginTOC)

  eleventyConfig.addCollection("allPathSorted", function (collectionApi) {
		return collectionApi.getAll().sort(function (a, b) {
			return a.inputPath.localeCompare(b.inputPath); // sort by path - ascending
		});
	});

  eleventyConfig.setQuietMode(true);
	eleventyConfig.addPlugin(directoryOutputPlugin);

  let markdownIt = require("markdown-it");
  let markdownLibrary = markdownIt({
    html: true,
    breaks: false,
    linkify: true,
    typographer: true,
    quotes: '«»„“'
  });
  // markdownLibrary.disable(['replacements']); //: {'replace_scoped'}

  /* Markdown Plugins */
  markdownLibrary.use(require("markdown-it-anchor"), {
    level: [2, 3, 4],
    permalink: false,
  });
  markdownLibrary.use(require("markdown-it-toc-done-right"), { level: [2,3,4] });

  eleventyConfig.setLibrary("md", markdownLibrary);
  let contentMap = null;
  // Async-friendly
  eleventyConfig.on("eleventy.contentMap", async ({inputPathToUrl, urlToInputPath}) => {
    // inputPathToUrl is an object mapping input file paths to output URLs
    // urlToInputPath is an object mapping output URLs to input file paths
    // console.log("in event: ", contentMap)
    let newInputPathToUrl = {}
    Object.keys(inputPathToUrl).map((k) => {
      let v = inputPathToUrl[k];
      return newInputPathToUrl[k] = !!v[0].endsWith(path.sep) ? [v[0]+'index.html'] : [ v[0] ]
    })

    contentMap = {
      inputPathToUrl: newInputPathToUrl,
      urlToInputPath: urlToInputPath
    }
  });
  // console.log("in config: ", contentMap);
  let inputDir;
  let outputDir;
  eleventyConfig.on("eleventy.directories", function ({ input, output }) {
    inputDir = (!input.startsWith('.') ? './'+input : input);
    outputDir = (!output.startsWith('.') ? './'+output : output);
  });

  eleventyConfig.addTransform("relativeUrlTransform", async function (content) {
    if (!contentMap) {
      throw new Error("Internal error: contentMap not available for `relativeUrlTransform` Transform.");
    }

    // let srcData = this;
    let srcFileDir = path.dirname(this.page.inputPath);
    let srcUrl = contentMap.inputPathToUrl[this.page.inputPath][0];
    let modifier = posthtml().use(
      urls({
        eachURL: function (url) {
          // return if starts with `#`
          if(url.startsWith("#")) { return url }
          // return if absolute URL
          if(URL.canParse(url)) { return url }

          let urlObj = new URL(url, 'file://');
          // normalize given path
          const normalizedUrl = path.normalize(urlObj.pathname);
          //resolve url to inputDir
          const fullUrl = './'+path.join(inputDir, (path.isAbsolute(normalizedUrl) ? normalizedUrl : path.join(srcFileDir, normalizedUrl)))
          const cmRelativeUrl = contentMap.inputPathToUrl[fullUrl]?
            contentMap.inputPathToUrl[fullUrl][0] : contentMap.urlToInputPath[normalizedUrl]?
              contentMap.inputPathToUrl[contentMap.urlToInputPath[normalizedUrl]][0] : normalizedUrl

          const relativeUrl = path.relative(path.dirname(srcUrl), cmRelativeUrl)
          // console.log("in transformer: ",
          //   {
          //     inputDir: inputDir,
          //     outputDir: outputDir,
          //     srcData: srcData,
          //     CM: contentMap,
          //     srcFileDir: srcFileDir,
          //     isUrl: URL.canParse(url),
          //     srcUrl: srcUrl,
          //     url: url,
          //     normUrl: normalizedUrl,
          //     fullUrl: fullUrl,
          //     CMurl: contentMap.inputPathToUrl[fullUrl],
          //     relativeUrl:  relativeUrl
          //   }
          // )
          return  !!relativeUrl.endsWith(path.delimiter) ? relativeUrl+'index.html' : relativeUrl + urlObj.search+urlObj.hash
        },
      })
    );

    let result = await modifier.process(content, {});
    return result.html;

		// console.log("in transformer: ",  this, inputDir/*, contentMap, result.html*/);
		// console.log("in transformer: ", contentMap)

		// return content; // no changes made.
	});
  return {
    templateFormats: ["md", "njk", "html"],
    pathPrefix: "./",
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",
    dir: {
      input: "src/content/pages",
      data: "../../_data",
      layouts: "../../_layouts",
      includes: "../../_includes",
      output: "_site"
    },
  }
}
