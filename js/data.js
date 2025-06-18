// Một vài mẫu lịch sử kết quả để test nhanh
const sampleHistories = {
    "mẫu 1": "T,X,T,X,T,T,X",
    "mẫu 2": "X,X,X,T,T,X,T",
    "mẫu 3": "T,T,T,T,X,X,T,X,X"
  };
  
  // Hàm chèn mẫu vào input
  function loadSample(name) {
    const input = document.getElementById("history");
    input.value = sampleHistories[name];
  }
  