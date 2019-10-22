import e from"dayjs";import t,{DataFrame as r}from"data-forge";import n from"lodash/isEqual";import a from"lodash/has";import u from"lodash/fromPairs";import o from"lodash/toPairs";import{median as i,medianAbsoluteDeviation as f,quantile as l,sampleStandardDeviation as s,mean as c,max as d}from"simple-statistics";import{Studentt as v}from"distributions";import"crypto";function h(){return(h=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var r=arguments[t];for(var n in r)Object.prototype.hasOwnProperty.call(r,n)&&(e[n]=r[n])}return e}).apply(this,arguments)}var p=function(e,t,r){var n,a=t.startValue,i=t.endValue,f=t.entryIndex,l=t.numEntries,s=r.overrideValue,c=r.dateFunction,d=r.date,v=r.flag;if(-1===["pad","interpolate","average","dateFunction","value"].indexOf(e))throw new Error("fill Type not supported");return"pad"===e?(n=u(o(a).map((function(e){var t=e[0];return[t,a[t]]}))),v=v||["fill","pad"]):"interpolate"===e?(n=u(o(a).map((function(e){var t=e[0];return[t,a[t]+(f+1)*((i[t]-a[t])/(l+1))]}))),v=v||["fill",e]):"average"===e?(n=u(o(a).map((function(e){var t=e[0];return[t,(a[t]+i[t])/l]}))),v=v||["fill",e]):"dateFunction"===e&&c?(n=u(o(a).map((function(e){return[e[0],c(d)]}))),v=v||["fill",e]):"value"===e?(n=u(o(a).map((function(e){var t=e[0];return[t,"number"==typeof s?s:s[t]]}))),v=v||["fill",e]):(n=u(o(a).map((function(e){return[e[0],null]}))),v=["fill"]),h({},n,{flag:v})};function m(e){var t=e.deflate((function(e){return e.x})).toArray(),n=s(t),a=c(t);if(0===n){var u=e.generateSeries({ares:function(e){return 0}});return{R:0,std:n,mean:a,df:u}}var o=new r({values:t.map((function(e){return{x:e,ares:Math.abs(e-a)/n}}))});return{R:d(o.deflate((function(e){return e.ares})).toArray()),df:o,std:n,mean:a}}function g(e,t,r){var n=function(e,t,r){return 1-r/(2*(e-t+1))}(e,t,r),a=function(e,t){return new v(t).inv(e)}(n,e-t-1);return{lambda:a*(e-t)/Math.sqrt((e-t-1+Math.pow(a,2))*(e-t+1)),p:n,t:a}}var y=function(e,t,r){return.6745*(e-r)/t};function w(e){var t=i(e),r=f(e),n=(e=e.sort((function(e,t){return t-e})).filter((function(e){return e>0})).map((function(e){return[e,y(e,r,t)]}))).filter((function(e){return Math.abs(e[1])>=3.5}));return{thresholds:{upper:Math.min.apply(Math,[Infinity].concat(n.map((function(e){return e[0]})))),lower:0}}}function O(r){if(r instanceof O)return r;r instanceof t.DataFrame&&(r=r.toArray());var n={values:r=r.map((function(t){var r=t.date,n=function(e,t){if(null==e)return{};var r,n,a={},u=Object.keys(e);for(n=0;n<u.length;n++)t.indexOf(r=u[n])>=0||(a[r]=e[r]);return a}(t,["date"]);return h({date:e(r)},n)})).sort((function(e,t){return e.date.valueOf()-t.date.valueOf()})),index:r.map((function(e){return e.date.toDate()})),considerAllRows:!0};t.DataFrame.call(this,n)}function b(e){var t,r=void 0===e?{}:e,n=r.column,a=void 0===n?"value":n,u=r.lowerThreshold,o=r.upperThreshold;if(u>o)throw new Error("thresholds invalid");var i=this.where((function(e){return function(e,t,r){return e<t||e>r}(e[a],u,o)})).generateSeries({raw:function(e){return e[a]},flag:function(e){var t=e.flag;return["outlier"].concat(void 0===t?[]:t)}}).transformSeries(((t={})[a]=function(e){return null},t));return new O(this.merge(i).toArray())}(O.prototype=Object.create(t.DataFrame.prototype)).constructor=O,O.prototype.getValueColumns=function(){return this.detectTypes().where((function(e){return"number"===e.Type})).distinct((function(e){return e.Column})).getSeries("Column").toArray()},O.prototype.getInterval=function(){var t,r,n;return t=this.getIndex().window(2).select((function(e){return e.last()-e.first()})).detectValues().orderBy((function(e){return-e.Frequency})).orderBy((function(e){return e.Value})).first().Value,r=e(),(n=e().add(t)).diff(r,"month",!0)>=11?["year",Math.ceil(n.diff(r,"year",!0))]:n.diff(r,"day",!0)>=28?["month",Math.ceil(n.diff(r,"month",!0))]:n.diff(r,"hour",!0)>=23?["day",Math.ceil(n.diff(r,"day",!0))]:n.diff(r,"minute",!0)>=55?["hour",Math.ceil(n.diff(r,"hour",!0))]:["minute",n.diff(r,"minute")]},O.prototype.getDateRange=function(t,r){var n=e(this.first().date),a=e(this.last().date);return r&&(n=n.startOf(r),a=a.endOf(r)),a.diff(n,t)},O.prototype.calculateStatistics=function(e){void 0===e&&(e={});var t=e.column,r=void 0===t?"value":t,n=e.filterZeros,a=void 0!==n&&n,u=e.filterNegative,o=void 0===u||u,i=this.deflate((function(e){return e[r]})).where((function(e){return!isNaN(e)}));o&&(i=i.where((function(e){return e>=0}))),a&&(i=i.where((function(e){return 0!==e})));var s=i.median(),c=i.average(),d=i.count(),v=i.std(),h=i.min(),p=i.max(),m=f(i.toArray()),g=l(i.toArray(),.25),y=l(i.toArray(),.75);return{median:s,mean:c,count:d,std:v,min:h,max:p,mad:m,q1:g,q3:y,iqr:y-g}},O.prototype.calculateThresholdOptions=function(e){var t,n,a,u,o=void 0===e?{}:e,i=o.k,f=o.filterZeros,s=void 0===f||f,c=o.filterNegative,d=void 0===c||c,v=this.where((function(e){return null==e.flag||Array.isArray(e.flag)&&0===e.flag.length})).where((function(e){return!isNaN(e.value)&&null!==e.value})).getSeries("value");return s&&(v=v.where((function(e){return 0!==e}))),d&&(v=v.where((function(e){return e>0}))),i||(i=v.count()<1e3?Math.floor(.15*v.count()):Math.min.apply(Math,[1e3,Math.floor(.02*v.count())])),v.count()<5?{}:{esd:function(e,t,n){void 0===e&&(e=[]),void 0===t&&(t=10),void 0===n&&(n=.05);for(var a,u=new r({values:e.map((function(e){return{x:e}}))}),o=u.getSeries("x").count(),i=1,f=[],l=!1;i<=t;){var s={};1===i?function(){var e=m(u),t=e.R,r=e.df,n=e.mean,o=e.std;a=r.where((function(e){return e.ares!==t})),s=Object.assign({},s,{mean:n,std:o,Value:r.where((function(e){return e.ares===t})).getSeries("x").first(),R:t})}():function(){var e=m(a),t=e.R,r=e.df,n=e.mean,u=e.std;a=r.where((function(e){return e.ares!==t})),s=Object.assign({},s,{mean:n,std:u,Value:r.where((function(e){return e.ares===t})).getSeries("x").first(),R:t})}();var c=g(o,i,n);if(s=Object.assign({},s,{lambda:c.lambda}),f.push(s),l&&s.R>s.lambda&&(l=!1),0===s.R)break;if(s.R<s.lambda){if(l)break;l=!0}i++}var d=(f=new r(f).generateSeries({outlier:function(e){return e.R>e.lambda}}).takeWhile((function(e){return e.outlier}))).where((function(e){return e.Value>0})).deflate((function(e){return e.Value}));return{outliers:f,thresholds:{lower:0,upper:d.count()>0?d.min():Infinity},iterations:i}}(v.toArray(),i).thresholds,box:(t=v.toArray(),n=l(t,.25),a=l(t,.75),{thresholds:{lowerInner:n-1.5*(u=a-n),upperInner:n-3*u,lowerOuter:a+1.5*u,upperOuter:a+3*u}}).thresholds,modz:w(v.toArray()).thresholds}},O.prototype.transformAllSeries=function(e,t){var r=t.exclude,n=this,a=a=n.detectTypes().where((function(e){return"number"===e.Type})).distinct((function(e){return e.Column})).getSeries("Column").toArray();return r&&Array.isArray(r)&&(a=a.filter((function(e){return-1===r.indexOf(e)}))),a.forEach((function(t){var r;n=n.transformSeries(((r={})[t]=function(t){return isNaN(t)?t:e(t)},r))})),n},O.prototype.reset=function(){return new O(this.withSeries({value:function(e){return e.flag&&Array.isArray(e.flag)&&e.flag.length>0?e.raw:e.value}}).subset(["date","value"]).where((function(e){return!isNaN(e.value)&&null!==e.value})))},O.prototype.group=function(t,r){if(-1===["hour","day","month","year"].indexOf(t))throw new Error("interval type not supported");return this.groupBy((function(r){return e(r.date).startOf(t)}))},O.prototype.removeOutliers=b,O.prototype.clean=b,O.prototype.downsample=function(t,r){var n=t[0],a=t[1];if(void 0===r&&(r="sum"),-1===["hour","day","month","year"].indexOf(n))throw new Error("interval type not supported");if(-1===["sum","avg","median"].indexOf(r))throw new Error("aggregation type not suppported, only:");var o=function(e){return e.date.startOf(n)},i=this.getValueColumns();return a&&(o=function(e){return e.date.startOf(n).add(a,n)}),new O(this.groupBy(o).select((function(e){return h({date:e.first().date.startOf(n)},u([].concat(i.map((function(t){var n;switch(r){case"median":n=e.deflate((function(e){return e[t]})).where((function(e){return!isNaN(e)&&null!==e})).median();break;case"avg":n=e.deflate((function(e){return e[t]})).where((function(e){return!isNaN(e)&&null!==e})).average();break;default:n=e.deflate((function(e){return e[t]})).where((function(e){return!isNaN(e)&&null!==e})).sum()}return[t,n]})),e.getColumnNames().filter((function(e){return"date"!==e})).filter((function(e){return-1===i.indexOf(e)})).map((function(t){var r=e.deflate((function(e){return e[t]})).distinct().toArray();return 1===r.length&&(r=r[0]),[t,r]})))))})).inflate().withIndex((function(t){return e(t.date).toDate()})))},O.prototype.upsample=function(t,r){var n=t[0],a=t[1];return void 0===r&&(r="avg"),new O(this.fillGaps(function(t){var r=t[0],n=t[1],a=void 0===n?1:n;return function(t,n){var u=t[0];return Math.floor(e(n[0]).diff(u,r,!0)/a)>0}}([n,a]),function(t,r,n){var a=r[0],u=r[1],o={},i=o.overrideValue,f=o.dateFunction,l=o.flag;return function(r,n){for(var o=e(r[0]),s=e(n[0]),c=Math.floor(e(s).diff(o,a)/u)-1,d=r[1],v=n[1],h=[],m=0;m<c;++m){var g=p(t,{startValue:d,endValue:v,entryIndex:m,numEntries:c},{overrideValue:i,dateFunction:f,flag:l}),y=e(o).add((m+1)*u,a).toDate(),w=[y.valueOf(),Object.assign({},g,{date:y})];h.push(w)}return h}}(r,[n,a])))},O.prototype.populate=function(e,t){var r;switch(void 0===t&&(t="avg"),t){case"fill":r=e;break;default:r=e/this.count()}return new O(this.generateSeries({value:function(e){return r}}))},O.prototype.reduceToValue=function(e){return new O(this.generateSeries({value:function(t){return function(e,t){return void 0===t&&(t=[]),t.map((function(t){return e[t]})).filter((function(e){return e}))[0]||0}(t,e)}}).subset(["date","value"]))},O.prototype.addBaselineDelta=function(e){var t;if(e instanceof O||(e=new O(e)),e.count()>1){var r,u=this.getInterval(),o=e.interval;if(!n(u,o))throw console.error(u,o),new Error("baseline and data intervals do not match");switch(u[0]){case"day":r=function(e){return e.month()+"-"+e.date()};break;case"month":r=function(e){return e.month()};break;default:r=function(e){return 0}}var i=e.withIndex((function(e){return r(e.date)}));t=this.generateSeries({baseline:function(e){return t=r(e.date),(n=i.at(t))&&a(n,"value")?n.value:i.getSeries("value").average();var t,n}})}else t=this.generateSeries({baseline:function(t){return e.first().value}});return new O(t=t.generateSeries({delta:function(e){return(e.value-(t=e.baseline))/t;var t}}))},O.prototype.annualIntensity=function(e){var t=this;void 0===e&&(e=1);var r=this.getInterval();return new O(this.groupBy((function(e){return e.date.year()})).select((function(n){var a,o=n.first().date,i=n.last().date.add(r[1]||1,r[0]||"month"),f=(a=o,365/dayjs(i).diff(dayjs(a),"day"));return h({startDate:o,endDate:i},u(t.getValueColumns().map((function(t){return[t,n.deflate((function(e){return e[t]})).where((function(e){return e})).sum()*f/e]}))))})).inflate().renameSeries({startDate:"date"}).dropSeries("endDate"))},O.prototype.fillMissing=function(){var e=this.first().date.toDate(),t=this.last().date.toDate(),r=this.getInterval(),n=O.blank(e,t,r,"missing").withIndex((function(e){return e.date.valueOf()}));return new O(this.withIndex((function(e){return e.date.valueOf()})).merge(n).transformSeries({flag:function(e){return e.value?void 0:e.flag}}))},O.prototype.fillNull=function(e){return new O(this.transformSeries({value:function(t){return null==t?e:t}}))},O.prototype.zeroReplacement=function(e){var t,r=function(e,t){void 0===t&&(t=2);var r=e.variableWindow((function(e,t){return e.value===t.value&&0===e.value})).where((function(e){return e.getIndex().count()>=t}));return{zeroSummary:r.select((function(e){return{start:e.first().date,end:e.last().date,count:e.count()}})).inflate(),zeroGroups:r}}(this,e).zeroGroups.toArray().map((function(e,t){return e.transformSeries({value:function(){return null},raw:function(){return 0},flag:function(e){return["zero"].concat(e||[])}}).withIndex((function(e){return new Date(e.date).valueOf()}))}));return new O((t=this.withIndex((function(e){return e.date.valueOf()}))).merge.apply(t,r))},O.prototype.monthlyWithQual=function(){return new O(this.groupBy((function(t){return e(t.date).startOf("month").valueOf()})).select((function(t){var r=e(t.first().date).startOf("month").toDate(),n=new Date(r.getFullYear(),r.getMonth()+1,0).getDate(),a=t.getSeries("value").where((function(e){return e&&0!==e})).toArray().length,u=t.getSeries("value").where((function(e){return!isNaN(e)})).sum();return{date:r,value:isNaN(u)?0:u,count:a,days:n,score:a/n}})).inflate().withIndex((function(e){return e.date.toDate()})))},O.prototype.threeYearAverage=function(t,r,n){void 0===r&&(r="value"),t=e(t),n||(n=this.getSeries("value").where((function(e){return!isNaN(e)&&null!==e})).average());var a=this.before(t.toDate()).where((function(e){return e.date.month()===t.month()})).orderBy((function(t){return e(t.date)})).tail(3);return a.count()>0?a.getSeries(r).where((function(e){return!isNaN(e)&&null!==e})).average():n},O.prototype.averageFill=function(){var e=this,t=e.getSeries("value").where((function(e){return!isNaN(e)&&null!==e})).average();return new O(e.generateSeries({rollingAverage:function(r){return e.threeYearAverage(r.date,"value",t)}}).generateSeries({flag:function(e){return e.value?e.flag:["filled"].concat(e.flag||[])}}).generateSeries({value:function(e){return e.value?e.value:e.rollingAverage}}).dropSeries(["rollingAverage"]))},O.blank=function(t,r,n,a){var u=n[0],o=n[1],i=void 0===o?1:o;if(["minute","hour","day","month","year"].indexOf(u)<0)throw console.error(l),new Error("interval type not supported");t=e(t),r=e(r);for(var f=[t],l=function(t){var r=t[0],n=t[1],a=e();return e().add(n,r).diff(a)}([u,i]);f[f.length-1].valueOf()<r.valueOf();)f.push(e(f[f.length-1]).add(i,u));return new O(f.map((function(e){return h({date:e},a&&{flag:a})})))},O.aggregate=function(e){Array.isArray(e)||(e=[e]),e=e.map((function(e){return new O(e)}));var r=new Set(e.map((function(e){return e.getValueColumns()})).reduce((function(e,t){return e.concat(t)}),[]));return new O(t.DataFrame.concat(e).groupBy((function(e){return e.date})).select((function(e){var t={date:e.first().date};return r.forEach((function(r){return t[r]=e.deflate((function(e){return e[r]})).sum()})),e.getColumnNames().filter((function(e){return"date"!==e})).filter((function(e){return-1===r.has(e)})).forEach((function(r){var n=e.deflate((function(e){return e[r]})).distinct().toArray();1===n.length&&(n=n[0]),t[r]=n})),t})).inflate())},O.concat=function(e){return Array.isArray(e)||(e=[e]),e=e.map((function(e){return new O(e)})),new O(t.DataFrame.concat(e))},O.merge=function(e){return Array.isArray(e)||(e=[e]),e=e.map((function(e){return new O(e)})),new O(t.DataFrame.merge(e))};export default O;
//# sourceMappingURL=index.module.js.map
