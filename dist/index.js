function e(e){return e&&"object"==typeof e&&"default"in e?e.default:e}var r=require("data-forge"),t=e(require("dayjs")),n=e(require("lodash/isEqual")),a=e(require("lodash/fromPairs"));require("lodash");var i=e(require("lodash/toPairs")),u=require("simple-statistics");function o(){return(o=Object.assign||function(e){for(var r=1;r<arguments.length;r++){var t=arguments[r];for(var n in t)Object.prototype.hasOwnProperty.call(t,n)&&(e[n]=t[n])}return e}).apply(this,arguments)}var f=function(e){var r=e[0],n=e[1],a=void 0===n?1:n;return function(e,n){var i=e[0];return Math.floor(t(n[0]).diff(i,r,!0)/a)>0}},l=function(e,r,t){var n,u=r.startValue,f=r.endValue,l=r.entryIndex,s=r.numEntries,d=t.overrideValue,c=t.dateFunction,v=t.date,h=t.flag;if(-1===["pad","interpolate","average","dateFunction","value"].indexOf(e))throw new Error("fill Type not supported");return"pad"===e?(n=a(i(u).map((function(e){var r=e[0];return[r,u[r]]}))),h=h||["fill","pad"]):"interpolate"===e?(n=a(i(u).map((function(e){var r=e[0];return[r,u[r]+(l+1)*((f[r]-u[r])/(s+1))]}))),h=h||["fill",e]):"average"===e?(n=a(i(u).map((function(e){var r=e[0];return[r,(u[r]+f[r])/s]}))),h=h||["fill",e]):"dateFunction"===e&&c?(n=a(i(u).map((function(e){return[e[0],c(v)]}))),h=h||["fill",e]):"value"===e?(n=a(i(u).map((function(e){var r=e[0];return[r,"number"==typeof d?d:d[r]]}))),h=h||["fill",e]):(n=a(i(u).map((function(e){return[e[0],null]}))),h=["fill"]),o({},n,{flag:h})},s=function(e,r,n){var a=r[0],i=r[1],u=void 0===n?{}:n,o=u.overrideValue,f=u.dateFunction,s=u.flag;return function(r,n){for(var u=t(r[0]),d=t(n[0]),c=Math.floor(t(d).diff(u,a)/i)-1,v=r[1],h=n[1],p=[],m=0;m<c;++m){var y=l(e,{startValue:v,endValue:h,entryIndex:m,numEntries:c},{overrideValue:o,dateFunction:f,flag:s}),w=t(u).add((m+1)*i,a).toDate(),g=[w.valueOf(),Object.assign({},y,{date:w})];p.push(g)}return p}};module.exports=function(e){var i,l;function d(t){if(void 0===t&&(t=[]),t instanceof d)return t||function(e){throw new ReferenceError("this hasn't been initialised - super() hasn't been called")}();t instanceof r.DataFrame&&(t=t.toArray());var n={values:t=t.sort((function(e,r){return new Date(e.date).valueOf()-new Date(r.date).valueOf()})),index:t.map((function(e){return new Date(e.date).valueOf()})),considerAllRows:!0};return e.call(this,n)||this}l=e,(i=d).prototype=Object.create(l.prototype),i.prototype.constructor=i,i.__proto__=l;var c,v=d.prototype;return v.dateRange=function(e,r){var n=t(this.first().date),a=t(this.last().date);return r&&(n=n.startOf(r),a=a.endOf(r)),a.diff(n,e)},v.at=function(r){return e.prototype.at.call(this,new Date(r).valueOf())},v.calculateThresholds=function(e){var r=void 0===e?{}:e,t=r.k,n=r.filterZeros,a=void 0===n||n,i=this.where((function(e){return null==e.flag||Array.isArray(e.flag)&&0===e.flag.length})).where((function(e){return!isNaN(e.value)&&null!==e.value})).getSeries("value");return a&&(i=i.where((function(e){return 0!==e}))),t||(t=i.count()<1e3?Math.floor(.15*i.count()):Math.min.apply(Math,[1e3,Math.floor(.02*i.count())])),i.count()<5?{}:{esd:rosnerTest(i.toArray(),t).thresholds,box:boxPlotTest(i.toArray()).thresholds,modz:modifiedZScoreTest(i.toArray()).thresholds}},v.calculateStatistics=function(e){var r=void 0===e?{}:e,t=r.filterZeros,n=void 0!==t&&t,a=r.filterNegative,i=void 0===a||a,o=this.deflate((function(e){return e[columnName]})).where((function(e){return!isNaN(e)}));i&&(o=o.where((function(e){return e>=0}))),n&&(o=o.where((function(e){return 0!==e})));var f=o.median(),l=o.average(),s=o.count(),d=o.std(),c=o.min(),v=o.max(),h=u.medianAbsoluteDeviation(o.toArray()),p=u.quantile(o.toArray(),.25),m=u.quantile(o.toArray(),.75);return{median:f,mean:l,count:s,std:d,min:c,max:v,mad:h,q1:p,q3:m,iqr:m-p}},v.dataQuality=function(){return this.count(),this.getSeries("flag").where((function(e){return null==e||Array.isArray(e)&&0===e.length})).count(),this.getSeries("flag").where((function(e){return Array.isArray(e)})).where((function(e){return-1!==e.indexOf("missing")})).count(),this.getSeries("flag").where((function(e){return Array.isArray(e)})).where((function(e){return-1!==e.indexOf("outlier")})).count(),this.getSeries("flag").where((function(e){return Array.isArray(e)})).where((function(e){return-1!==e.indexOf("zeroFill")})).count(),{}},v.transformAll=function(e,r){void 0===e&&(e=function(e){return e});var t=this;return r||(r=t.detectTypes().where((function(e){return"number"===e.Type})).distinct((function(e){return e.Column})).getSeries("Column").toArray()),r.forEach((function(r){var n;t=t.transformSeries(((n={})[r]=function(r){return isNaN(r)?r:e(r)},n))})),new d(t)},v.removeOutliers=function(e){var r=void 0===e?{}:e,t=r.lowerThreshold,n=r.upperThreshold;if(t>n)throw new Error("thresholds invalid");var a=function(e,r,t){return e<r||e>t};return new d(this.generateSeries({raw:function(e){return a(e.value,t,n)?e.value:null},flag:function(e){return a(e.value,t,n)?["outlier"]:null}}).transformSeries({value:function(e){return a(e,t,n)?null:e}}))},v.reset=function(){return this.withSeries({value:function(e){return e.raw&&!isNaN(e.raw)?e.raw:e.value}}).dropSeries(["flag","raw"])},v.group=function(e,r){if(-1===["hour","day","month","year"].indexOf(e))throw new Error("interval type not supported");return this.groupBy((function(r){return t(r.date).startOf(e)}))},v.resample=function(e,r){var a=e[0],i=e[1],u=void 0===i?1:i;if(-1===["hour","day","month","year"].indexOf(a))throw new Error("interval type not supported");var o=this.interval;if(n(o,[a,u]))return this;var f=t(0);return t(0).add(o[1],o[0]).diff(f)<t(0).add(u,a).diff(f)?this.downsample([a,u],r):this.upsample([a,u],r)},v.upsample=function(e,r){var t=e[0],n=e[1];return void 0===r&&(r="avg"),new d(this.fillGaps(f([t,n]),s(r,[t,n])))},v.downsample=function(e,r){var n=e[0],i=e[1];if(void 0===r&&(r="sum"),-1===["hour","day","month","year"].indexOf(n))throw new Error("interval type not supported");if(-1===["sum","avg","median"].indexOf(r))throw new Error("aggregation type not suppported, only:");var u=function(e){return t(e.date).startOf(n)};return i&&(u=function(e){return t(e.date).startOf(n).add(i,n)}),new d(this.groupBy(u).select((function(e){return o({date:t(e.first().date).startOf(n).toDate()},a(e.getColumnNames().filter((function(e){return"date"!==e})).map((function(t){var n;switch(r){case"median":n=e.deflate((function(e){return e[t]})).median();break;case"avg":n=e.deflate((function(e){return e[t]})).average();break;default:n=e.deflate((function(e){return e[t]})).sum()}return[t,n]}))))})).inflate().withIndex((function(e){return e.date.valueOf()})))},v.populate=function(e,r){var t;switch(void 0===r&&(r="avg"),r){case"fill":t=e;break;default:t=e/this.getIndex().count()}return new d(this.generateSeries({value:function(e){return t}}))},v.fill=function(e,r){return e&&Array.isArray(e)||(e=this.interval),new d(this.fillGaps(f(e),s(r,e)))},v.reduceToValue=function(e){return new d(this.generateSeries({value:function(r){return function(e,r){return void 0===r&&(r=[]),r.map((function(r){return e[r]})).filter((function(e){return e}))[0]||0}(r,e)}}).subset(["date","value"]))},v.clean=function(e,r){void 0===e&&(e="value");var t=r.lowerThreshold,n=r.upperThreshold;return new d(this.toArray().map((function(r){var a=r[e];return a>n||a<t?o({},r,{value:void 0,raw:a}):r})))},d.blank=function(e,r,n){var a=n[0],i=n[1],u=void 0===i?1:i;if(["minute","hour","day","month","year"].indexOf(a)<0)throw console.error(interval),new Error("interval type not supported");var l=new d([{date:new Date(e)},{date:new Date(r)}]).fillGaps(f([a,u]),function(e,r){var n=e[0],a=e[1];return function(e,r){for(var i=e[0],u=Math.floor(t(r[0]).diff(i,n)/a)-1,f=[],l=0;l<u;++l){var s=t(i).add((l+1)*a,n).toDate();f.push([s.valueOf(),o({date:s,value:null},void 0)])}return f}}([a,u])).between(e,r);return new d(l)},d.aggregate=function(e){return Array.isArray(e)||(e=[e]),e=e.map((function(e){return new d(e)})),new d(r.DataFrame.concat(e).groupBy((function(e){return e.date})).select((function(e){var r={date:e.first().date};return e.getColumnNames().filter((function(e){return"date"!==e})).forEach((function(t){return r[t]=e.deflate((function(e){return e[t]})).sum()})),r})).inflate().toArray())},v.annualMonthlyAverage=function(e){var r=e.startDate,t=e.endDate;this.downsample(["month",1],"sum").between(r,t).getSeries("value").average()},(c=[{key:"interval",get:function(){var e,r,n,a=this.first().date,i=this.last().date;return e=this.between(a,i).getIndex().window(2).select((function(e){return e.last()-e.first()})).detectValues().orderBy((function(e){return e.Frequency})).orderBy((function(e){return e.Value})).last().Value,r=t(),(n=t().add(e)).diff(r,"year",!0)>=1?["year",n.diff(r,"year")]:n.diff(r,"month",!0)>=1?["month",n.diff(r,"month")]:n.diff(r,"day",!0)>=1?["day",n.diff(r,"day")]:n.diff(r,"hour",!0)>=1?["hour",n.diff(r,"hour")]:["minute",n.diff(r,"minute")]}}])&&function(e,r){for(var t=0;t<r.length;t++){var n=r[t];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}(d.prototype,c),d}(r.DataFrame);
//# sourceMappingURL=index.js.map
