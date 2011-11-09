var Links = function(size) {
  this.size = size;
  this.arr = new Array(size);
  for(var i=0;i<size;i++){
    this.arr[i] = new Array(i+1);
  }
}

Links.prototype = {
  set_to_zeros: function() {
    for(var i=0;i<this.size;i++){
      for(var j=0;j<i;j++){
        this.arr[i][j]=0;
      }
    }
    return;
  },
  set_to_ones: function() {
    for(var i=0;i<this.size;i++){
      for(var j=0;j<i;j++){
        this.arr[i][j]=1;
      }
    }
    return;
  },
  incr_links: function(x,y) {
    this.arr[Math.max(x,y)][Math.min(x,y)]++;
    return;
  },
  to_protovis: function(){
    var out = new Array();
    for(var i=0;i<this.size;i++){
      for(var j=0;j<i;j++){
        if(this.arr[i][j]!=0){
          out.push({"source":i, "target":j, "value":this.arr[i][j]})
        }
      }
    }
    return out;
  }
};

module.exports = Links;