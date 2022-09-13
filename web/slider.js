var slider = document.getElementById("myRange");
var output = document.getElementById("depth");
output.innerHTML = slider.value; // Display the default slider value

// Update the engine depth
slider.oninput = function() {
  output.innerHTML = this.value;
  setDepth(this.value);
} 