import{DataFrame as e}from"data-forge";import r from"dayjs";import t from"lodash/isEqual";import n from"lodash/fromPairs";import a from"lodash/toPairs";import{medianAbsoluteDeviation as i,quantile as u}from"simple-statistics";function o(){return(o=Object.assign||function(e){for(var r=1;r<arguments.length;r++){var t=arguments[r];for(var n in t)Object.prototype.hasOwnProperty.call(t,n)&&(e[n]=t[n])}return e}).apply(this,arguments)}var f=function(e){var t=e[0],n=e[1],a=void 0===n?1:n;return function(e,n){var i=e[0];return Math.floor(r(n[0]).diff(i,t,!0)/a)>0}},l=function(e,r,t){var i,u=r.startValue,f=r.endValue,l=r.entryIndex,s=r.numEntries,d=t.overrideValue,c=t.dateFunction,h=t.date,v=t.flag;if(-1===["pad","interpolate","average","dateFunction","value"].indexOf(e))throw new Error("fill Type not supported");return"pad"===e?(i=n(a(u).map((function(e){var r=e[0];return[r,u[r]]}))),v=v||["fill","pad"]):"interpolate"===e?(i=n(a(u).map((function(e){var r=e[0];return[r,u[r]+(l+1)*((f[r]-u[r])/(s+1))]}))),v=v||["fill",e]):"average"===e?(i=n(a(u).map((function(e){var r=e[0];return[r,(u[r]+f[r])/s]}))),v=v||["fill",e]):"dateFunction"===e&&c?(i=n(a(u).map((function(e){return[e[0],c(h)]}))),v=v||["fill",e]):"value"===e?(i=n(a(u).map((function(e){var r=e[0];return[r,"number"==typeof d?d:d[r]]}))),v=v||["fill",e]):(i=n(a(u).map((function(e){return[e[0],null]}))),v=["fill"]),o({},i,{flag:v})},s=function(e,t,n){var a=t[0],i=t[1],u=void 0===n?{}:n,o=u.overrideValue,f=u.dateFunction,s=u.flag;return function(t,n){for(var u=r(t[0]),d=r(n[0]),c=Math.floor(r(d).diff(u,a)/i)-1,h=t[1],v=n[1],p=[],m=0;m<c;++m){var y=l(e,{startValue:h,endValue:v,entryIndex:m,numEntries:c},{overrideValue:o,dateFunction:f,flag:s}),w=r(u).add((m+1)*i,a).toDate(),g=[w.valueOf(),Object.assign({},y,{date:w})];p.push(g)}return p}},d=function(a){var l,d;function c(t){if(void 0===t&&(t=[]),t instanceof c)return t||function(e){throw new ReferenceError("this hasn't been initialised - super() hasn't been called")}();t instanceof e&&(t=t.toArray());var n={values:t=t.map((function(e){var t=e.date,n=function(e,r){if(null==e)return{};var t,n,a={},i=Object.keys(e);for(n=0;n<i.length;n++)r.indexOf(t=i[n])>=0||(a[t]=e[t]);return a}(e,["date"]);return o({date:r(t)},n)})).sort((function(e,r){return e.date.valueOf()-r.date.valueOf()})),index:t.map((function(e){return e.date.toDate()})),considerAllRows:!0};return a.call(this,n)||this}d=a,(l=c).prototype=Object.create(d.prototype),l.prototype.constructor=l,l.__proto__=d;var h,v=c.prototype;return v.dateRange=function(e,t){var n=r(this.first().date),a=r(this.last().date);return t&&(n=n.startOf(t),a=a.endOf(t)),a.diff(n,e)},v.at=function(e){return a.prototype.at.call(this,r(e))},v.calculateThresholds=function(e){var r=void 0===e?{}:e,t=r.k,n=r.filterZeros,a=void 0===n||n,i=this.where((function(e){return null==e.flag||Array.isArray(e.flag)&&0===e.flag.length})).where((function(e){return!isNaN(e.value)&&null!==e.value})).getSeries("value");return a&&(i=i.where((function(e){return 0!==e}))),t||(t=i.count()<1e3?Math.floor(.15*i.count()):Math.min.apply(Math,[1e3,Math.floor(.02*i.count())])),i.count()<5?{}:{esd:rosnerTest(i.toArray(),t).thresholds,box:boxPlotTest(i.toArray()).thresholds,modz:modifiedZScoreTest(i.toArray()).thresholds}},v.calculateStatistics=function(e){var r=void 0===e?{}:e,t=r.filterZeros,n=void 0!==t&&t,a=r.filterNegative,o=void 0===a||a,f=this.deflate((function(e){return e[columnName]})).where((function(e){return!isNaN(e)}));o&&(f=f.where((function(e){return e>=0}))),n&&(f=f.where((function(e){return 0!==e})));var l=f.median(),s=f.average(),d=f.count(),c=f.std(),h=f.min(),v=f.max(),p=i(f.toArray()),m=u(f.toArray(),.25),y=u(f.toArray(),.75);return{median:l,mean:s,count:d,std:c,min:h,max:v,mad:p,q1:m,q3:y,iqr:y-m}},v.dataQuality=function(){return this.count(),this.getSeries("flag").where((function(e){return null==e||Array.isArray(e)&&0===e.length})).count(),this.getSeries("flag").where((function(e){return Array.isArray(e)})).where((function(e){return-1!==e.indexOf("missing")})).count(),this.getSeries("flag").where((function(e){return Array.isArray(e)})).where((function(e){return-1!==e.indexOf("outlier")})).count(),this.getSeries("flag").where((function(e){return Array.isArray(e)})).where((function(e){return-1!==e.indexOf("zeroFill")})).count(),{}},v.transformAll=function(e,r){void 0===e&&(e=function(e){return e});var t=this;return r||(r=t.detectTypes().where((function(e){return"number"===e.Type})).distinct((function(e){return e.Column})).getSeries("Column").toArray()),r.forEach((function(r){var n;t=t.transformSeries(((n={})[r]=function(r){return isNaN(r)?r:e(r)},n))})),new c(t)},v.removeOutliers=function(e){var r=void 0===e?{}:e,t=r.lowerThreshold,n=r.upperThreshold;if(t>n)throw new Error("thresholds invalid");var a=function(e,r,t){return e<r||e>t};return new c(this.generateSeries({raw:function(e){return a(e.value,t,n)?e.value:null},flag:function(e){return a(e.value,t,n)?["outlier"]:null}}).transformSeries({value:function(e){return a(e,t,n)?null:e}}))},v.reset=function(){return this.withSeries({value:function(e){return e.raw&&!isNaN(e.raw)?e.raw:e.value}}).dropSeries(["flag","raw"])},v.group=function(e,t){if(-1===["hour","day","month","year"].indexOf(e))throw new Error("interval type not supported");return this.groupBy((function(t){return r(t.date).startOf(e)}))},v.resample=function(e,n){var a=e[0],i=e[1],u=void 0===i?1:i;if(-1===["hour","day","month","year"].indexOf(a))throw new Error("interval type not supported");var o=this.interval;if(t(o,[a,u]))return this;var f=r(0);return r(0).add(o[1],o[0]).diff(f)<r(0).add(u,a).diff(f)?this.downsample([a,u],n):this.upsample([a,u],n)},v.upsample=function(e,r){var t=e[0],n=e[1];return void 0===r&&(r="avg"),new c(this.fillGaps(f([t,n]),s(r,[t,n])))},v.downsample=function(e,t){var a=e[0],i=e[1];if(void 0===t&&(t="sum"),-1===["hour","day","month","year"].indexOf(a))throw new Error("interval type not supported");if(-1===["sum","avg","median"].indexOf(t))throw new Error("aggregation type not suppported, only:");var u=function(e){return e.date.startOf(a)},f=this.valueColumns;return i&&(u=function(e){return e.date.startOf(a).add(i,a)}),new c(this.groupBy(u).select((function(e){return o({date:e.first().date.startOf(a)},n([].concat(f.map((function(r){var n;switch(t){case"median":n=e.deflate((function(e){return e[r]})).where((function(e){return e})).median();break;case"avg":n=e.deflate((function(e){return e[r]})).where((function(e){return e})).average();break;default:n=e.deflate((function(e){return e[r]})).where((function(e){return e})).sum()}return[r,n]})),e.getColumnNames().filter((function(e){return"date"!==e})).filter((function(e){return-1===f.indexOf(e)})).map((function(r){var t=e.deflate((function(e){return e[r]})).distinct().toArray();return 1===t.length&&(t=t[0]),[r,t]})))))})).inflate().withIndex((function(e){return r(e.date).toDate()})))},v.populate=function(e,r){var t;switch(void 0===r&&(r="avg"),r){case"fill":t=e;break;default:t=e/this.getIndex().count()}return new c(this.generateSeries({value:function(e){return t}}))},v.fill=function(e,r){return e&&Array.isArray(e)||(e=this.interval),new c(this.fillGaps(f(e),s(r,e)))},v.reduceToValue=function(e){return new c(this.generateSeries({value:function(r){return function(e,r){return void 0===r&&(r=[]),r.map((function(r){return e[r]})).filter((function(e){return e}))[0]||0}(r,e)}}).subset(["date","value"]))},v.clean=function(e,r){void 0===e&&(e="value");var t=r.lowerThreshold,n=r.upperThreshold;return new c(this.toArray().map((function(r){var a=r[e];return a>n||a<t?o({},r,{value:void 0,raw:a}):r})))},c.blank=function(e,t,n){var a=n[0],i=n[1],u=void 0===i?1:i;if(["minute","hour","day","month","year"].indexOf(a)<0)throw console.error(interval),new Error("interval type not supported");var l=new c([{date:r(e)},{date:r(t)}]).fillGaps(f([a,u]),function(e,t){var n=e[0],a=e[1];return function(e,t){for(var i=e[0],u=Math.floor(r(t[0]).diff(i,n)/a)-1,f=[],l=0;l<u;++l){var s=r(i).add((l+1)*a,n).toDate();f.push([s.valueOf(),o({date:s,value:null},void 0)])}return f}}([a,u])).between(e,t);return new c(l)},c.aggregate=function(r){return Array.isArray(r)||(r=[r]),r=r.map((function(e){return new c(e)})),new c(e.concat(r).groupBy((function(e){return e.date})).select((function(e){var r={date:e.first().date};return e.getColumnNames().filter((function(e){return"date"!==e})).forEach((function(t){return r[t]=e.deflate((function(e){return e[t]})).sum()})),r})).inflate().toArray())},v.annualMonthlyAverage=function(e){var r=e.startDate,t=e.endDate;this.downsample(["month",1],"sum").between(r,t).getSeries("value").average()},v.annualIntensity=function(e){var t=this;void 0===e&&(e=1);var a=this.interval;return new c(this.groupBy((function(e){return e.date.year()})).select((function(i){var u,f=i.first().date,l=i.last().date.add(a[1]||1,a[0]||"month"),s=(u=f,365/r(l).diff(r(u),"day"));return o({startDate:f,endDate:l},n(t.valueColumns.map((function(r){return[r,i.deflate((function(e){return e[r]})).where((function(e){return e})).sum()*s/e]}))))})).inflate().renameSeries({startDate:"date"}).dropSeries("endDate"))},(h=[{key:"interval",get:function(){var e,t,n;return e=this.getIndex().window(2).select((function(e){return e.last()-e.first()})).detectValues().orderBy((function(e){return e.Frequency})).orderBy((function(e){return e.Value})).last().Value,t=r(),n=r().add(e),console.log(n.diff(t,"day")),n.diff(t,"month",!0)>=11?["year",Math.ceil(n.diff(t,"year",!0))]:n.diff(t,"day",!0)>=28?["month",Math.ceil(n.diff(t,"month",!0))]:n.diff(t,"hour",!0)>=23?["day",Math.ceil(n.diff(t,"day",!0))]:n.diff(t,"minute",!0)>=55?["hour",Math.ceil(n.diff(t,"hour",!0))]:["minute",n.diff(t,"minute")]}},{key:"valueColumns",get:function(){return this.detectTypes().where((function(e){return"number"===e.Type})).distinct((function(e){return e.Column})).getSeries("Column").toArray()}}])&&function(e,r){for(var t=0;t<r.length;t++){var n=r[t];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}(c.prototype,h),c}(e);export default d;
//# sourceMappingURL=index.module.js.map
