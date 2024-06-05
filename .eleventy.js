const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");
const eleventyFilterRelativeUrl = require('eleventy-filter-relative-url');
const eleventyPluginTOC = require('eleventy-plugin-toc');

module.exports = function(eleventyConfig) {
  eleventyConfig.setDataDeepMerge(true);
  
  eleventyConfig.addWatchTarget("./src/_assets/")
  eleventyConfig.addPassthroughCopy({"./src/_assets/":"/assets"})
  eleventyConfig.addWatchTarget("./src/content/media/")
  eleventyConfig.addPassthroughCopy({"./src/content/media/":"/assets/media"})

  // Filter to make all paths relative
  eleventyConfig.addFilter('url', eleventyFilterRelativeUrl);

  eleventyConfig.addPlugin(eleventyNavigationPlugin);
  eleventyConfig.addPlugin(eleventyPluginTOC)

  eleventyConfig.addCollection("allPathSorted", function (collectionApi) {
		return collectionApi.getAll().sort(function (a, b) {
			return a.inputPath.localeCompare(b.inputPath); // sort by path - ascending
		});
	});

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
