// increase & decrease of quantity in product.ejs

  const decreaseBtn = document.getElementById("decreaseBtn");
  const increaseBtn = document.getElementById("increaseBtn");
  const quantityInput = document.getElementById("quantityInput");

  decreaseBtn.addEventListener("click", () => {
    let value = parseInt(quantityInput.value);
    if (value > 1) quantityInput.value = value - 1;
    cartQuantityInput.value = quantityInput.value;
  });

  increaseBtn.addEventListener("click", () => {
    let value = parseInt(quantityInput.value);
    quantityInput.value = value + 1;
    cartQuantityInput.value = quantityInput.value;
  });

  // cartQuantity updation

  const cartQuantityInput = document.getElementById("cartQuantityInput");

  quantityInput.addEventListener("input", () => {
  cartQuantityInput.value = quantityInput.value;
});


  cartQuantityInput.value = quantityInput.value;


