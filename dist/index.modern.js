import{DataFrame as r}from"data-forge";import t from"dayjs";import e from"lodash/isEqual";import n from"lodash/fromPairs";import"lodash";import a from"lodash/toPairs";import{medianAbsoluteDeviation as o,quantile as i}from"simple-statistics";function u(){return(u=Object.assign||function(r){for(var t=1;t<arguments.length;t++){var e=arguments[t];for(var n in e)Object.prototype.hasOwnProperty.call(e,n)&&(r[n]=e[n])}return r}).apply(this,arguments)}var f=function(r){var e=r[0],n=r[1],a=void 0===n?1:n;return function(r,n){var o=r[0],i=Math.floor(t(n[0]).diff(o,e,!0)/a);return console.log(i),i>0}},l=function(r,t,e){var o,i=t.startValue,f=t.endValue,l=t.entryIndex,s=t.numEntries,d=e.overrideValue,c=e.dateFunction,h=e.date,v=e.flag;if(-1===["pad","interpolate","average","dateFunction","value"].indexOf(r))throw new Error("fill Type not supported");return"pad"===r?(o=n(a(i).map(function(r){var t=r[0];return[t,i[t]]})),v=v||["fill","pad"]):"interpolate"===r?(o=n(a(i).map(function(r){var t=r[0];return[t,i[t]+(l+1)*((f[t]-i[t])/(s+1))]})),v=v||["fill",r]):"average"===r?(o=n(a(i).map(function(r){var t=r[0];return[t,(i[t]+f[t])/s]})),v=v||["fill",r]):"dateFunction"===r&&c?(o=n(a(i).map(function(r){return[r[0],c(h)]})),v=v||["fill",r]):"value"===r?(o=n(a(i).map(function(r){var t=r[0];return[t,"number"==typeof d?d:d[t]]})),v=v||["fill",r]):(o=n(a(i).map(function(r){return[r[0],null]})),v=["fill"]),u({},o,{flag:v})},s=function(r,e,n){var a=e[0],o=e[1],i=void 0===n?{}:n,u=i.overrideValue,f=i.dateFunction,s=i.flag;return function(e,n){console.log(e,n);for(var i=t(e[0]),d=t(n[0]),c=Math.floor(t(d).diff(i,a)/o)-1,h=e[1],v=n[1],p=[],m=0;m<c;++m){var y=l(r,{startValue:h,endValue:v,entryIndex:m,numEntries:c},{overrideValue:u,dateFunction:f,flag:s}),g=t(i).add((m+1)*o,a).toDate(),w=[g.valueOf(),Object.assign({},y,{date:g})];p.push(w)}return console.log(p),p}},d=function(a){var l,d;function c(t){void 0===t&&(t=[]),(t instanceof r||t instanceof c)&&(t=t.toArray());var e={values:t=t.sort(function(r,t){return new Date(r.date).valueOf()-new Date(t.date).valueOf()}),index:t.map(function(r){return new Date(r.date).valueOf()}),considerAllRows:!0};return a.call(this,e)||this}d=a,(l=c).prototype=Object.create(d.prototype),l.prototype.constructor=l,l.__proto__=d;var h,v=c.prototype;return v.dateRange=function(r,e){var n=t(this.first().date),a=t(this.last().date);return e&&(n=n.startOf(e),a=a.endOf(e)),a.diff(n,r)},v.at=function(r){return a.prototype.at.call(this,new Date(r).valueOf())},v.calculateThresholds=function(r){var t=void 0===r?{}:r,e=t.k,n=t.filterZeros,a=void 0===n||n,o=this.where(function(r){return null==r.flag||Array.isArray(r.flag)&&0===r.flag.length}).where(function(r){return!isNaN(r.value)&&null!==r.value}).getSeries("value");return a&&(o=o.where(function(r){return 0!==r})),e||(e=o.count()<1e3?Math.floor(.15*o.count()):Math.min.apply(Math,[1e3,Math.floor(.02*o.count())])),o.count()<5?{}:{esd:rosnerTest(o.toArray(),e).thresholds,box:boxPlotTest(o.toArray()).thresholds,modz:modifiedZScoreTest(o.toArray()).thresholds}},v.removeOutliers=function(r){var t=void 0===r?{}:r,e=t.lowerThreshold,n=t.upperThreshold;if(e>n)throw new Error("thresholds invalid");var a=function(r,t,e){return r<t||r>e};return this.generateSeries({raw:function(r){return a(r.value,e,n)?r.value:null},flag:function(r){return a(r.value,e,n)?["outlier"]:null}}).transformSeries({value:function(r){return a(r,e,n)?null:r}})},v.reset=function(){return this.withSeries({value:function(r){return r.raw&&!isNaN(r.raw)?r.raw:r.value}}).dropSeries(["flag","raw"])},v.group=function(r,e){if(-1===["hour","day","month","year"].indexOf(r))throw new Error("interval type not supported");return this.groupBy(function(e){return t(e.date).startOf(r)})},v.resample=function(r,n){var a=r[0],o=r[1],i=void 0===o?1:o;if(-1===["hour","day","month","year"].indexOf(a))throw new Error("interval type not supported");var u=this.interval;if(e(u,[a,i]))return this;var f=t(0);return t(0).add(u[1],u[0]).diff(f)<t(0).add(i,a).diff(f)?this.downsample([a,i],n):this.upsample([a,i],n)},v.upsample=function(r,t){var e=r[0],n=r[1];return void 0===t&&(t="avg"),this.fillGaps(f([e,n]),s(t,[e,n]))},v.downsample=function(r,e){var a=r[0],o=r[1];if(void 0===e&&(e="sum"),-1===["hour","day","month","year"].indexOf(a))throw new Error("interval type not supported");if(-1===["sum","avg","median"].indexOf(e))throw new Error("aggregation type not suppported, only:");var i=function(r){return t(r.date).startOf(a)};return o&&(i=function(r){return t(r.date).startOf(a).add(o,a)}),this.groupBy(i).select(function(r){return u({date:t(r.first().date).startOf(a).toDate()},n(r.getColumnNames().filter(function(r){return"date"!==r}).map(function(t){var n;switch(e){case"median":n=r.deflate(function(r){return r[t]}).median();break;case"avg":n=r.deflate(function(r){return r[t]}).average();break;default:n=r.deflate(function(r){return r[t]}).sum()}return[t,n]})))}).inflate().withIndex(function(r){return r.date.valueOf()})},v.calculateStatistics=function(r){var t=void 0===r?{}:r,e=t.filterZeros,n=void 0!==e&&e,a=t.filterNegative,u=void 0===a||a,f=this.deflate(function(r){return r[columnName]}).where(function(r){return!isNaN(r)});u&&(f=f.where(function(r){return r>=0})),n&&(f=f.where(function(r){return 0!==r}));var l=f.median(),s=f.average(),d=f.count(),c=f.std(),h=f.min(),v=f.max(),p=o(f.toArray()),m=i(f.toArray(),.25),y=i(f.toArray(),.75);return{median:l,mean:s,count:d,std:c,min:h,max:v,mad:p,q1:m,q3:y,iqr:y-m}},v.dataQuality=function(){return this.count(),this.getSeries("flag").where(function(r){return null==r||Array.isArray(r)&&0===r.length}).count(),this.getSeries("flag").where(function(r){return Array.isArray(r)}).where(function(r){return-1!==r.indexOf("missing")}).count(),this.getSeries("flag").where(function(r){return Array.isArray(r)}).where(function(r){return-1!==r.indexOf("outlier")}).count(),this.getSeries("flag").where(function(r){return Array.isArray(r)}).where(function(r){return-1!==r.indexOf("zeroFill")}).count(),{}},v.populate=function(r,t){var e;switch(void 0===t&&(t="avg"),t){case"fill":e=r;break;default:e=r/this.getIndex().count()}return this.generateSeries({value:function(r){return e}})},v.fill=function(r,t){return r&&Array.isArray(r)||(r=this.interval),new c(this.fillGaps(f(r),s(t,r)))},c.blank=function(r,e,n){var a=n[0],o=n[1],i=void 0===o?1:o;if(["minute","hour","day","month","year"].indexOf(a)<0)throw console.error(interval),new Error("interval type not supported");var l=new c([{date:new Date(r)},{date:new Date(e)}]).fillGaps(f([a,i]),function(r,e){var n=r[0],a=r[1];return function(r,e){for(var o=r[0],i=Math.floor(t(e[0]).diff(o,n)/a)-1,f=[],l=0;l<i;++l){var s=t(o).add((l+1)*a,n).toDate();f.push([s.valueOf(),u({date:s,value:null},void 0)])}return f}}([a,i])).between(r,e);return new c(l)},c.aggregate=function(t){return Array.isArray(t)||(t=[t]),t=t.map(function(r){return new c(r)}),new c(r.concat(t).groupBy(function(r){return r.date}).select(function(r){var t={date:r.first().date};return r.getColumnNames().filter(function(r){return"date"!==r}).forEach(function(e){return t[e]=r.deflate(function(r){return r[e]}).sum()}),t}).inflate().toArray())},(h=[{key:"interval",get:function(){var r,e,n,a=this.first().date,o=this.last().date;return r=this.between(a,o).getIndex().window(2).select(function(r){return r.last()-r.first()}).detectValues().orderBy(function(r){return r.Frequency}).orderBy(function(r){return r.Value}).last().Value,e=t(),(n=t().add(r)).diff(e,"year",!0)>=1?["year",n.diff(e,"year")]:n.diff(e,"month",!0)>=1?["month",n.diff(e,"month")]:n.diff(e,"day",!0)>=1?["day",n.diff(e,"day")]:n.diff(e,"hour",!0)>=1?["hour",n.diff(e,"hour")]:["minute",n.diff(e,"minute")]}}])&&function(r,t){for(var e=0;e<t.length;e++){var n=t[e];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(r,n.key,n)}}(c.prototype,h),c}(r);export default d;
//# sourceMappingURL=index.modern.js.map
