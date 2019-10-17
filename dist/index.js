function e(e){return e&&"object"==typeof e&&"default"in e?e.default:e}var r=require("data-forge"),t=e(require("dayjs")),n=e(require("lodash/isEqual")),a=e(require("lodash/fromPairs")),u=e(require("lodash/toPairs")),i=require("simple-statistics");function o(){return(o=Object.assign||function(e){for(var r=1;r<arguments.length;r++){var t=arguments[r];for(var n in t)Object.prototype.hasOwnProperty.call(t,n)&&(e[n]=t[n])}return e}).apply(this,arguments)}var f=function(e){var r=e[0],n=e[1],a=void 0===n?1:n;return function(e,n){var u=e[0];return Math.floor(t(n[0]).diff(u,r,!0)/a)>0}},l=function(e,r,t){var n,i=r.startValue,f=r.endValue,l=r.entryIndex,s=r.numEntries,d=t.overrideValue,c=t.dateFunction,h=t.date,v=t.flag;if(-1===["pad","interpolate","average","dateFunction","value"].indexOf(e))throw new Error("fill Type not supported");return"pad"===e?(n=a(u(i).map((function(e){var r=e[0];return[r,i[r]]}))),v=v||["fill","pad"]):"interpolate"===e?(n=a(u(i).map((function(e){var r=e[0];return[r,i[r]+(l+1)*((f[r]-i[r])/(s+1))]}))),v=v||["fill",e]):"average"===e?(n=a(u(i).map((function(e){var r=e[0];return[r,(i[r]+f[r])/s]}))),v=v||["fill",e]):"dateFunction"===e&&c?(n=a(u(i).map((function(e){return[e[0],c(h)]}))),v=v||["fill",e]):"value"===e?(n=a(u(i).map((function(e){var r=e[0];return[r,"number"==typeof d?d:d[r]]}))),v=v||["fill",e]):(n=a(u(i).map((function(e){return[e[0],null]}))),v=["fill"]),o({},n,{flag:v})},s=function(e,r,n){var a=r[0],u=r[1],i=void 0===n?{}:n,o=i.overrideValue,f=i.dateFunction,s=i.flag;return function(r,n){for(var i=t(r[0]),d=t(n[0]),c=Math.floor(t(d).diff(i,a)/u)-1,h=r[1],v=n[1],p=[],m=0;m<c;++m){var y=l(e,{startValue:h,endValue:v,entryIndex:m,numEntries:c},{overrideValue:o,dateFunction:f,flag:s}),w=t(i).add((m+1)*u,a).toDate(),g=[w.valueOf(),Object.assign({},y,{date:w})];p.push(g)}return p}};module.exports=function(e){var u,l;function d(n){if(void 0===n&&(n=[]),n instanceof d)return n||function(e){throw new ReferenceError("this hasn't been initialised - super() hasn't been called")}();n instanceof r.DataFrame&&(n=n.toArray());var a={values:n=n.map((function(e){var r=e.date,n=function(e,r){if(null==e)return{};var t,n,a={},u=Object.keys(e);for(n=0;n<u.length;n++)r.indexOf(t=u[n])>=0||(a[t]=e[t]);return a}(e,["date"]);return o({date:t(r)},n)})).sort((function(e,r){return e.date.valueOf()-r.date.valueOf()})),index:n.map((function(e){return e.date})),considerAllRows:!0};return e.call(this,a)||this}l=e,(u=d).prototype=Object.create(l.prototype),u.prototype.constructor=u,u.__proto__=l;var c,h=d.prototype;return h.dateRange=function(e,r){var n=t(this.first().date),a=t(this.last().date);return r&&(n=n.startOf(r),a=a.endOf(r)),a.diff(n,e)},h.at=function(r){return e.prototype.at.call(this,t(r))},h.calculateThresholds=function(e){var r=void 0===e?{}:e,t=r.k,n=r.filterZeros,a=void 0===n||n,u=this.where((function(e){return null==e.flag||Array.isArray(e.flag)&&0===e.flag.length})).where((function(e){return!isNaN(e.value)&&null!==e.value})).getSeries("value");return a&&(u=u.where((function(e){return 0!==e}))),t||(t=u.count()<1e3?Math.floor(.15*u.count()):Math.min.apply(Math,[1e3,Math.floor(.02*u.count())])),u.count()<5?{}:{esd:rosnerTest(u.toArray(),t).thresholds,box:boxPlotTest(u.toArray()).thresholds,modz:modifiedZScoreTest(u.toArray()).thresholds}},h.calculateStatistics=function(e){var r=void 0===e?{}:e,t=r.filterZeros,n=void 0!==t&&t,a=r.filterNegative,u=void 0===a||a,o=this.deflate((function(e){return e[columnName]})).where((function(e){return!isNaN(e)}));u&&(o=o.where((function(e){return e>=0}))),n&&(o=o.where((function(e){return 0!==e})));var f=o.median(),l=o.average(),s=o.count(),d=o.std(),c=o.min(),h=o.max(),v=i.medianAbsoluteDeviation(o.toArray()),p=i.quantile(o.toArray(),.25),m=i.quantile(o.toArray(),.75);return{median:f,mean:l,count:s,std:d,min:c,max:h,mad:v,q1:p,q3:m,iqr:m-p}},h.dataQuality=function(){return this.count(),this.getSeries("flag").where((function(e){return null==e||Array.isArray(e)&&0===e.length})).count(),this.getSeries("flag").where((function(e){return Array.isArray(e)})).where((function(e){return-1!==e.indexOf("missing")})).count(),this.getSeries("flag").where((function(e){return Array.isArray(e)})).where((function(e){return-1!==e.indexOf("outlier")})).count(),this.getSeries("flag").where((function(e){return Array.isArray(e)})).where((function(e){return-1!==e.indexOf("zeroFill")})).count(),{}},h.transformAll=function(e,r){void 0===e&&(e=function(e){return e});var t=this;return r||(r=t.detectTypes().where((function(e){return"number"===e.Type})).distinct((function(e){return e.Column})).getSeries("Column").toArray()),r.forEach((function(r){var n;t=t.transformSeries(((n={})[r]=function(r){return isNaN(r)?r:e(r)},n))})),new d(t)},h.removeOutliers=function(e){var r=void 0===e?{}:e,t=r.lowerThreshold,n=r.upperThreshold;if(t>n)throw new Error("thresholds invalid");var a=function(e,r,t){return e<r||e>t};return new d(this.generateSeries({raw:function(e){return a(e.value,t,n)?e.value:null},flag:function(e){return a(e.value,t,n)?["outlier"]:null}}).transformSeries({value:function(e){return a(e,t,n)?null:e}}))},h.reset=function(){return this.withSeries({value:function(e){return e.raw&&!isNaN(e.raw)?e.raw:e.value}}).dropSeries(["flag","raw"])},h.group=function(e,r){if(-1===["hour","day","month","year"].indexOf(e))throw new Error("interval type not supported");return this.groupBy((function(r){return t(r.date).startOf(e)}))},h.resample=function(e,r){var a=e[0],u=e[1],i=void 0===u?1:u;if(-1===["hour","day","month","year"].indexOf(a))throw new Error("interval type not supported");var o=this.interval;if(n(o,[a,i]))return this;var f=t(0);return t(0).add(o[1],o[0]).diff(f)<t(0).add(i,a).diff(f)?this.downsample([a,i],r):this.upsample([a,i],r)},h.upsample=function(e,r){var t=e[0],n=e[1];return void 0===r&&(r="avg"),new d(this.fillGaps(f([t,n]),s(r,[t,n])))},h.downsample=function(e,r){var t=e[0],n=e[1];if(void 0===r&&(r="sum"),-1===["hour","day","month","year"].indexOf(t))throw new Error("interval type not supported");if(-1===["sum","avg","median"].indexOf(r))throw new Error("aggregation type not suppported, only:");var u=function(e){return e.date.startOf(t)},i=this.valueColumns;return n&&(u=function(e){return e.date.startOf(t).add(n,t)}),new d(this.groupBy(u).select((function(e){return o({date:e.first().date.startOf(t)},a([].concat(i.map((function(t){var n;switch(r){case"median":n=e.deflate((function(e){return e[t]})).where((function(e){return e})).median();break;case"avg":n=e.deflate((function(e){return e[t]})).where((function(e){return e})).average();break;default:n=e.deflate((function(e){return e[t]})).where((function(e){return e})).sum()}return[t,n]})),e.getColumnNames().filter((function(e){return"date"!==e})).filter((function(e){return-1===i.indexOf(e)})).map((function(r){var t=e.deflate((function(e){return e[r]})).distinct().toArray();return 1===t.length&&(t=t[0]),[r,t]})))))})).inflate().withIndex((function(e){return e.date.valueOf()})))},h.populate=function(e,r){var t;switch(void 0===r&&(r="avg"),r){case"fill":t=e;break;default:t=e/this.getIndex().count()}return new d(this.generateSeries({value:function(e){return t}}))},h.fill=function(e,r){return e&&Array.isArray(e)||(e=this.interval),new d(this.fillGaps(f(e),s(r,e)))},h.reduceToValue=function(e){return new d(this.generateSeries({value:function(r){return function(e,r){return void 0===r&&(r=[]),r.map((function(r){return e[r]})).filter((function(e){return e}))[0]||0}(r,e)}}).subset(["date","value"]))},h.clean=function(e,r){void 0===e&&(e="value");var t=r.lowerThreshold,n=r.upperThreshold;return new d(this.toArray().map((function(r){var a=r[e];return a>n||a<t?o({},r,{value:void 0,raw:a}):r})))},d.blank=function(e,r,n){var a=n[0],u=n[1],i=void 0===u?1:u;if(["minute","hour","day","month","year"].indexOf(a)<0)throw console.error(interval),new Error("interval type not supported");var l=new d([{date:t(e)},{date:t(r)}]).fillGaps(f([a,i]),function(e,r){var n=e[0],a=e[1];return function(e,r){for(var u=e[0],i=Math.floor(t(r[0]).diff(u,n)/a)-1,f=[],l=0;l<i;++l){var s=t(u).add((l+1)*a,n).toDate();f.push([s.valueOf(),o({date:s,value:null},void 0)])}return f}}([a,i])).between(e,r);return new d(l)},d.aggregate=function(e){return Array.isArray(e)||(e=[e]),e=e.map((function(e){return new d(e)})),new d(r.DataFrame.concat(e).groupBy((function(e){return e.date})).select((function(e){var r={date:e.first().date};return e.getColumnNames().filter((function(e){return"date"!==e})).forEach((function(t){return r[t]=e.deflate((function(e){return e[t]})).sum()})),r})).inflate().toArray())},h.annualMonthlyAverage=function(e){var r=e.startDate,t=e.endDate;this.downsample(["month",1],"sum").between(r,t).getSeries("value").average()},h.annualIntensity=function(e){var r=this;void 0===e&&(e=1);var n=this.interval;return new d(this.groupBy((function(e){return e.date.year()})).select((function(u){var i,f=u.first().date,l=u.last().date.add(n[1]||1,n[0]||"month"),s=(i=f,365/t(l).diff(t(i),"day"));return o({startDate:f,endDate:l},a(r.valueColumns.map((function(r){return[r,u.deflate((function(e){return e[r]})).where((function(e){return e})).sum()*s/e]}))))})).inflate().renameSeries({startDate:"date"}).dropSeries("endDate"))},(c=[{key:"interval",get:function(){var e,r,n;return e=this.getIndex().window(2).select((function(e){return e.last()-e.first()})).detectValues().orderBy((function(e){return e.Frequency})).orderBy((function(e){return e.Value})).last().Value,r=t(),n=t().add(e),console.log(n.diff(r,"day")),n.diff(r,"month",!0)>=11?["year",Math.ceil(n.diff(r,"year",!0))]:n.diff(r,"day",!0)>=28?["month",Math.ceil(n.diff(r,"month",!0))]:n.diff(r,"hour",!0)>=23?["day",Math.ceil(n.diff(r,"day",!0))]:n.diff(r,"minute",!0)>=55?["hour",Math.ceil(n.diff(r,"hour",!0))]:["minute",n.diff(r,"minute")]}},{key:"valueColumns",get:function(){return this.detectTypes().where((function(e){return"number"===e.Type})).distinct((function(e){return e.Column})).getSeries("Column").toArray()}}])&&function(e,r){for(var t=0;t<r.length;t++){var n=r[t];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}(d.prototype,c),d}(r.DataFrame);
//# sourceMappingURL=index.js.map
