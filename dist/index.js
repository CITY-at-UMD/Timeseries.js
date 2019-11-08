function e(e){return e&&"object"==typeof e&&"default"in e?e.default:e}var t=e(require("dayjs")),r=require("data-forge"),n=e(r),a=e(require("lodash/isEqual")),u=e(require("lodash/has")),i=e(require("lodash/get")),o=e(require("lodash/fromPairs")),f=e(require("lodash/toPairs")),l=require("simple-statistics"),s=require("distributions");function c(){return(c=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var r=arguments[t];for(var n in r)Object.prototype.hasOwnProperty.call(r,n)&&(e[n]=r[n])}return e}).apply(this,arguments)}var d=function(e){var r=e[0],n=e[1],a=t();return t().add(n,r).diff(a)},h=function(e,t,r){var n,a=t.startValue,u=t.endValue,i=t.entryIndex,l=t.numEntries,s=r.overrideValue,d=r.dateFunction,h=r.date,v=r.flag;if(-1===["pad","interpolate","average","dateFunction","value"].indexOf(e))throw new Error("fill Type not supported");return"pad"===e?(n=o(f(a).map((function(e){var t=e[0];return[t,a[t]]}))),v=v||["fill","pad"]):"interpolate"===e?(n=o(f(a).map((function(e){var t=e[0];return[t,a[t]+(i+1)*((u[t]-a[t])/(l+1))]}))),v=v||["fill",e]):"average"===e?(n=o(f(a).map((function(e){var t=e[0];return[t,(a[t]+u[t])/l]}))),v=v||["fill",e]):"dateFunction"===e&&d?(n=o(f(a).map((function(e){return[e[0],d(h)]}))),v=v||["fill",e]):"value"===e?(n=o(f(a).map((function(e){var t=e[0];return[t,"number"==typeof s?s:s[t]]}))),v=v||["fill",e]):(n=o(f(a).map((function(e){return[e[0],null]}))),v=["fill"]),c({},n,{flag:v})},v=function(e){return new Map(e.group("month").select((function(e){return{month:e.first().date.month(),value:e.getSeries("value").where((function(e){return e})).average()}})).toArray().map((function(e){return[e.month,e.value]})))};function p(e){var t=e.deflate((function(e){return e.x})).toArray(),n=l.sampleStandardDeviation(t),a=l.mean(t);if(0===n){var u=e.generateSeries({ares:function(e){return 0}});return{R:0,std:n,mean:a,df:u}}var i=new r.DataFrame({values:t.map((function(e){return{x:e,ares:Math.abs(e-a)/n}}))});return{R:l.max(i.deflate((function(e){return e.ares})).toArray()),df:i,std:n,mean:a}}function g(e,t,r){var n=function(e,t,r){return 1-r/(2*(e-t+1))}(e,t,r),a=function(e,t){return new s.Studentt(t).inv(e)}(n,e-t-1);return{lambda:a*(e-t)/Math.sqrt((e-t-1+Math.pow(a,2))*(e-t+1)),p:n,t:a}}var m=function(e,t,r){return.6745*(e-r)/t};function y(e){var t=l.median(e),r=l.medianAbsoluteDeviation(e),n=(e=e.sort((function(e,t){return t-e})).filter((function(e){return e>0})).map((function(e){return[e,m(e,r,t)]}))).filter((function(e){return Math.abs(e[1])>=3.5}));return{thresholds:{upper:Math.min.apply(Math,[Infinity].concat(n.map((function(e){return e[0]})))),lower:0}}}var w=function(e,t){return(t-e)/e};function b(e,r){if(e instanceof b)return e;e instanceof n.DataFrame&&(e=e.toArray());var a={values:e=e.map((function(e){var r=e.date,n=function(e,t){if(null==e)return{};var r,n,a={},u=Object.keys(e);for(n=0;n<u.length;n++)t.indexOf(r=u[n])>=0||(a[r]=e[r]);return a}(e,["date"]);return c({date:t(r)},n)})).sort((function(e,t){return e.date.valueOf()-t.date.valueOf()})),index:e.map((function(e){return e.date.toDate()})),considerAllRows:!0};n.DataFrame.call(this,a)}function S(e){var t,r=void 0===e?{}:e,n=r.series,a=void 0===n?"value":n,u=r.lower,i=r.upper;if(u>i)throw new Error("thresholds invalid");var o=this.where((function(e){return function(e,t,r){return e<t||e>r}(e[a],u,i)})).generateSeries({raw:function(e){return e[a]},flag:function(e){var t=e.flag;return["outlier"].concat(void 0===t?[]:t)}}).transformSeries(((t={})[a]=function(e){return null},t));return new b(this.merge(o))}function A(e){var t;if(e instanceof b||(e=new b(e)),e.count()>1){var r,n=this.getInterval(),i=e.interval;if(!a(n,i))throw console.error(n,i),new Error("baseline and data intervals do not match");switch(n[0]){case"day":r=function(e){return e.month()+"-"+e.date()};break;case"month":r=function(e){return e.month()};break;default:r=function(e){return 0}}var o=e.withIndex((function(e){return r(e.date)}));t=this.generateSeries({baseline:function(e){return t=r(e.date),(n=o.at(t))&&u(n,"value")?n.value:o.getSeries("value").average();var t,n}})}else t=this.generateSeries({baseline:function(t){return e.first().value}});return new b(t=t.generateSeries({delta:function(e){return w(e.baseline,e.value)}}))}(b.prototype=Object.create(n.DataFrame.prototype)).constructor=b,b.prototype.getValueColumns=function(){return this.detectTypes().where((function(e){return"number"===e.Type})).distinct((function(e){return e.Column})).getSeries("Column").toArray()},b.prototype.getInterval=function(){var e,r,n;return e=this.getIndex().window(2).select((function(e){return e.last()-e.first()})).detectValues().orderBy((function(e){return-e.Frequency})).first().Value,r=t(),(n=t().add(e)).diff(r,"month",!0)>=11?["year",Math.ceil(n.diff(r,"year",!0))]:n.diff(r,"day",!0)>=28?["month",Math.ceil(n.diff(r,"month",!0))]:n.diff(r,"hour",!0)>=23?["day",Math.ceil(n.diff(r,"day",!0))]:n.diff(r,"minute",!0)>=55?["hour",Math.ceil(n.diff(r,"hour",!0))]:["minute",n.diff(r,"minute")]},b.prototype.getDateRange=function(e,r){var n=t(this.first().date),a=t(this.last().date);return r&&(n=n.startOf(r),a=a.endOf(r)),a.diff(n,e)},b.prototype.calculateStatistics=function(e){void 0===e&&(e={});var t=e.column,r=void 0===t?"value":t,n=e.filterZeros,a=void 0!==n&&n,u=e.filterNegative,i=void 0===u||u,o=this.deflate((function(e){return e[r]})).where((function(e){return!isNaN(e)}));i&&(o=o.where((function(e){return e>=0}))),a&&(o=o.where((function(e){return 0!==e})));var f=o.median(),s=o.average(),c=o.count(),d=o.std(),h=o.min(),v=o.max(),p=l.medianAbsoluteDeviation(o.toArray()),g=l.quantile(o.toArray(),.25),m=l.quantile(o.toArray(),.75);return{median:f,mean:s,count:c,std:d,min:h,max:v,mad:p,q1:g,q3:m,iqr:m-g}},b.prototype.calculateThresholdOptions=function(e){var t,n,a,u,i=void 0===e?{}:e,o=i.k,f=i.filterZeros,s=void 0===f||f,c=i.filterNegative,d=void 0===c||c,h=this.where((function(e){return null==e.flag||Array.isArray(e.flag)&&0===e.flag.length})).where((function(e){return!isNaN(e.value)&&null!==e.value})).getSeries("value");return s&&(h=h.where((function(e){return 0!==e}))),d&&(h=h.where((function(e){return e>0}))),o||(o=h.count()<1e3?Math.floor(.15*h.count()):Math.min.apply(Math,[1e3,Math.floor(.02*h.count())])),h.count()<5?{}:{esd:function(e,t,n){void 0===e&&(e=[]),void 0===t&&(t=10),void 0===n&&(n=.05);for(var a,u=new r.DataFrame({values:e.map((function(e){return{x:e}}))}),i=u.getSeries("x").count(),o=1,f=[],l=!1;o<=t;){var s={};1===o?function(){var e=p(u),t=e.R,r=e.df,n=e.mean,i=e.std;a=r.where((function(e){return e.ares!==t})),s=Object.assign({},s,{mean:n,std:i,Value:r.where((function(e){return e.ares===t})).getSeries("x").first(),R:t})}():function(){var e=p(a),t=e.R,r=e.df,n=e.mean,u=e.std;a=r.where((function(e){return e.ares!==t})),s=Object.assign({},s,{mean:n,std:u,Value:r.where((function(e){return e.ares===t})).getSeries("x").first(),R:t})}();var c=g(i,o,n);if(s=Object.assign({},s,{lambda:c.lambda}),f.push(s),l&&s.R>s.lambda&&(l=!1),0===s.R)break;if(s.R<s.lambda){if(l)break;l=!0}o++}var d=(f=new r.DataFrame(f).generateSeries({outlier:function(e){return e.R>e.lambda}}).takeWhile((function(e){return e.outlier}))).where((function(e){return e.Value>0})).deflate((function(e){return e.Value}));return{outliers:f,thresholds:{lower:0,upper:d.count()>0?d.min():Infinity},iterations:o}}(h.toArray(),o).thresholds,box:(t=h.toArray(),n=l.quantile(t,.25),a=l.quantile(t,.75),{thresholds:{lowerInner:n-1.5*(u=a-n),upperInner:n-3*u,lowerOuter:a+1.5*u,upperOuter:a+3*u}}).thresholds,modz:y(h.toArray()).thresholds}},b.prototype.getBestThreshold=function(){try{var e=this.calculateThresholdOptions(),t=l.ckmeans([i(e,"esd.upper",null),i(e,"modz.upper",null),i(e,"box.lowerOuter",null),i(e,"box.upperOuter",null)].filter((function(e){return e})),2);return l.max(t.reduce((function(e,t){return e.length>t.length?e:t})))}catch(e){throw console.error(e),new Error("Cannot determine threshold")}},b.prototype.betweenDates=function(e,t){return new b(this.between(e,t))},b.prototype.transformAllSeries=function(e,t){var r=t.exclude,n=this,a=a=n.detectTypes().where((function(e){return"number"===e.Type})).distinct((function(e){return e.Column})).getSeries("Column").toArray();return r&&Array.isArray(r)&&(a=a.filter((function(e){return-1===r.indexOf(e)}))),a.forEach((function(t){var r;n=n.transformSeries(((r={})[t]=function(t){return isNaN(t)?t:e(t)},r))})),n},b.prototype.reset=function(){return new b(this.withSeries({value:function(e){return e.flag&&Array.isArray(e.flag)&&e.flag.length>0?e.raw:e.value}}).subset(["date","value"]).where((function(e){return!isNaN(e.value)&&null!==e.value})))},b.prototype.group=function(e,r){if(-1===["hour","day","month","year"].indexOf(e))throw new Error("interval type not supported");return this.groupBy((function(r){return t(r.date).startOf(e)}))},b.prototype.removeOutliers=S,b.prototype.clean=S,b.prototype.downsample=function(e,r){var n=e[0],a=e[1];if(void 0===r&&(r="sum"),-1===["hour","day","month","year"].indexOf(n))throw new Error("interval type not supported");if(-1===["sum","avg","median"].indexOf(r))throw new Error("aggregation type not suppported, only:");var u=function(e){return e.date.startOf(n)},i=this.getValueColumns();return a&&(u=function(e){return e.date.startOf(n).add(a,n)}),new b(this.groupBy(u).select((function(e){return c({date:e.first().date.startOf(n)},o([].concat(i.map((function(t){var n;switch(r){case"median":n=e.deflate((function(e){return e[t]})).where((function(e){return!isNaN(e)&&null!==e})).median();break;case"avg":n=e.deflate((function(e){return e[t]})).where((function(e){return!isNaN(e)&&null!==e})).average();break;default:n=e.deflate((function(e){return e[t]})).where((function(e){return!isNaN(e)&&null!==e})).sum()}return[t,n]})),e.getColumnNames().filter((function(e){return"date"!==e})).filter((function(e){return-1===i.indexOf(e)})).map((function(t){var r=e.deflate((function(e){return e[t]})).distinct().toArray();return 1===r.length&&(r=r[0]),[t,r]})))))})).inflate().withIndex((function(e){return t(e.date).toDate()})))},b.prototype.upsample=function(e,r){var n=e[0],a=e[1];return void 0===r&&(r="avg"),new b(this.fillGaps(function(e){var r=e[0],n=e[1],a=void 0===n?1:n;return function(e,n){var u=e[0];return Math.floor(t(n[0]).diff(u,r,!0)/a)>0}}([n,a]),function(e,r,n){var a=r[0],u=r[1],i={},o=i.overrideValue,f=i.dateFunction,l=i.flag;return function(r,n){for(var i=t(r[0]),s=t(n[0]),c=Math.floor(t(s).diff(i,a)/u)-1,d=r[1],v=n[1],p=[],g=0;g<c;++g){var m=h(e,{startValue:d,endValue:v,entryIndex:g,numEntries:c},{overrideValue:o,dateFunction:f,flag:l}),y=t(i).add((g+1)*u,a).toDate(),w=[y.valueOf(),Object.assign({},m,{date:y})];p.push(w)}return p}}(r,[n,a])))},b.prototype.populate=function(e,t){var r;switch(void 0===t&&(t="avg"),t){case"fill":r=e;break;default:r=e/this.count()}return new b(this.generateSeries({value:function(e){return r}}))},b.prototype.reduceToValue=function(e){return new b(this.generateSeries({value:function(t){return function(e,t){return void 0===t&&(t=[]),t.map((function(t){return e[t]})).filter((function(e){return e}))[0]||0}(t,e)}}).subset(["date","value"]))},b.prototype.rollingPercentChange=function(e){return new b(this.withSeries("delta",full.getSeries("value").percentChange()))},b.prototype.baselinePercentChange=A,b.prototype.addBaselineDelta=A,b.prototype.annualIntensity=function(e){var r=this;void 0===e&&(e=1);var n=this.getInterval();return new b(this.groupBy((function(e){return e.date.year()})).select((function(a){var u,i=a.first().date,f=a.last().date.add(n[1]||1,n[0]||"month"),l=(u=i,365/t(f).diff(t(u),"day"));return c({startDate:i,endDate:f},o(r.getValueColumns().map((function(t){return[t,a.deflate((function(e){return e[t]})).where((function(e){return e})).sum()*l/e]}))))})).inflate().renameSeries({startDate:"date"}).dropSeries("endDate"))},b.prototype.fillMissing=function(){var e=this.first().date.toDate(),t=this.last().date.toDate(),r=this.getInterval(),n=b.blank(e,t,r,"missing").withIndex((function(e){return e.date.valueOf()})).merge(this.withIndex((function(e){return e.date.valueOf()}))).generateSeries({flag:function(e){return null==e.value?e.flag:void 0}});return new b(n)},b.prototype.fillNull=function(e){var t,r,n=e.series,a=void 0===n?"value":n,u=e.value,i=e.callback,o=function(e){return null==e[a]};return i?new b(this.generateSeries(((t={flag:function(e){return o(e)?["fill"].concat(e.flag||[]):e.flag}})[a]=function(e){return o(e)?i(e):e[a]},t))):u?new b(this.generateSeries({flag:function(e){return o(e)?["fill"].concat(e.flag||[]):e.flag}}).transformSeries(((r={})[a]=function(e){return null==e?u:e},r))):this},b.prototype.zeroFaultDetection=function(e){Array.isArray(e)||(e=[e,1]),e=d(e);var t=this.where((function(e){return 0===e.value})).ensureSeries("interval",this.where((function(e){return 0===e.value})).getSeries("date").amountChange()).where((function(t){return t.interval<=e})).subset(["date"]).generateSeries({value:function(e){return null},flag:function(e){return["zeroFault"]}});return new b(this.merge(t))},b.prototype.dataQuality=function(){var e=this.count(),t=this.where((function(e){return Array.isArray(e.flag)&&e.flag.length>0})).groupBy((function(e){return e.flag.toString()})).select((function(t){return{flag:t.first().flag,count:t.count(),percent:t.count()/e*100}})).inflate();return console.log(t.toString()),{}},b.prototype.monthlyWithQual=function(){var e=this.getInterval(),r=d(e);return new b(this.groupBy((function(e){return t(e.date).startOf().valueOf()})).select((function(e){var n=t(e.first().date).startOf("month").toDate(),a=Math.floor(t(n).endOf("month").diff(t(n),"millisecond")/r),u=(new Date(n.getFullYear(),n.getMonth()+1,0).getDate(),e.getSeries("value").where((function(e){return e&&0!==e})).toArray().length),i=e.getSeries("value").where((function(e){return!isNaN(e)})).sum();return{date:n,value:isNaN(i)?0:i,count:u,fullCount:a,score:u/a}})).inflate().withIndex((function(e){return e.date.toDate()})))},b.prototype.threeYearAverage=function(e,r,n){void 0===r&&(r="value"),e=t(e),n||(n=this.getSeries(r).where((function(e){return!isNaN(e)&&null!==e})).average());var a=this.before(e.toDate()).where((function(t){return t.date.month()===e.month()})).orderBy((function(e){return t(e.date)})).tail(3);return a.count()>0?a.getSeries(r).where((function(e){return!isNaN(e)&&null!==e})).average():n},b.prototype.averageFill=function(){var e=this,t=e.getSeries("value").where((function(e){return!isNaN(e)&&null!==e})).average();return new b(e.generateSeries({rollingAverage:function(r){return e.threeYearAverage(r.date,"value",t)}}).generateSeries({flag:function(e){return e.value?e.flag:["filled"].concat(e.flag||[])}}).generateSeries({value:function(e){return e.value?e.value:e.rollingAverage}}).dropSeries(["rollingAverage"]))},b.blank=function(e,r,n,a){var u=n[0],i=n[1],o=void 0===i?1:i;if(["minute","hour","day","month","year"].indexOf(u)<0)throw console.error(l),new Error("interval type not supported");e=t(e),r=t(r);for(var f=[e],l=d([u,o]);f[f.length-1].valueOf()<r.valueOf();)f.push(t(f[f.length-1]).add(o,u));var s=new b(f.map((function(e){return{date:e}})));return a&&(s=new b(s.generateSeries({flag:function(e){return[a]}}))),s},b.aggregate=function(e){Array.isArray(e)||(e=[e]),e=e.map((function(e){return new b(e)}));var t=new Set(e.map((function(e){return e.getValueColumns()})).reduce((function(e,t){return e.concat(t)}),[]));return new b(n.DataFrame.concat(e).groupBy((function(e){return e.date})).select((function(e){var r={date:e.first().date};return t.forEach((function(t){return r[t]=e.deflate((function(e){return e[t]})).sum()})),e.getColumnNames().filter((function(e){return"date"!==e})).filter((function(e){return-1===t.has(e)})).forEach((function(t){var n=e.deflate((function(e){return e[t]})).distinct().toArray();1===n.length&&(n=n[0]),r[t]=n})),r})).inflate())},b.concat=function(e){return Array.isArray(e)||(e=[e]),e=e.map((function(e){return new b(e).withIndex((function(e){return e.date.valueOf()}))})),new b(n.DataFrame.concat(e))},b.merge=function(e){return Array.isArray(e)||(e=[e]),e=e.map((function(e){return new b(e).withIndex((function(e){return e.date.valueOf()}))})),new b(n.DataFrame.merge(e))},exports.Timeseries=b,exports.annualAverage=function(e,t){var r=void 0===t?{}:t,n=r.series,a=void 0===n?"value":n,u=r.years,i=void 0===u?3:u;return function(t){var r=e.subset(["date",a]).after(t.date.subtract(i,"year").toDate()).before(t.date.toDate()).bake(),n=r.where((function(e){return e.date.month()===t.date.month()})).where((function(e){return e.date.date()===t.date.date()})).where((function(e){return e.date.hour()===t.date.hour()})).where((function(e){return e.date.minute()===t.date.minute()})).getSeries(a).where((function(e){return e}));return n.count()<i?n.appendPair([null,r.getSeries(a).where((function(e){return e})).average()]).average():n.average()}},exports.annualMonthlyAverageMap=function(e){return new Map(e.groupBy((function(e){return e.date.year()})).select((function(e){var t=e.first().date.startOf("year"),r=new Timeseries(e).downsample(["month",1],"avg"),n=r.getSeries("value").average(),a=v(r);return a.set("avg",n),[t.year(),a]})).toArray())},exports.averageMonthlyMap=v,exports.fillMonthlyBAnnualyMap=function(e){return function(t){var r=t.date.month(),n=t.date.year();return e.has(r)?e.has(r)?e.get(r).get(n):l.mean([].concat(e.get(r).values())):l.mean([].concat(e.values()).map((function(e){return[].concat(e.values()).reduce((function(e,t){return e.concat(t)}),[])})))}},exports.fillMonthlyByMap=function(e){return function(t){return e.get(t.date.month())}},exports.monthlyRollingAverageMap=function(e,t){var r=void 0===t?{}:t,n=r.years,a=void 0===n?3:n,u=r.series,i=void 0===u?"value":u,o=e.groupBy((function(e){return e.date.startOf("month").toDate()})).select((function(e){return{date:e.first().date.startOf("month"),value:e.getSeries(i).where((function(e){return e})).average()}})).inflate().withIndex((function(e){return e.date.toDate()})).bake(),f=o.groupBy((function(e){return e.date.month()})).select((function(e){var t=new Map(e.rollingWindow(a).select((function(e){return[e.last().date.year(),e.getSeries(i).average()]})));return e.where((function(e){return!t.has(e.date.year())})).forEach((function(e){var r=o.before(e.date.toDate()).count()>0?o.before(e.date.toDate()).last()[i]:o.getSeries(i).average();t.set(e.date.year(),r)})),[e.first().date.month(),t]})).toArray();return new Map(f)},exports.pad=function(e,t){var r=(void 0===t?{}:t).series,n=void 0===r?"value":r;return function(t){var r=e.before(t.date.toDate()).getSeries(n).where((function(e){return e}));return r.count()>0?r.last():0}};
//# sourceMappingURL=index.js.map
