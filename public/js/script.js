// Script untuk Telegram Auto Poster

document.addEventListener('DOMContentLoaded', function() {
  
  // Tambahkan class active ke link navbar sesuai dengan halaman yang aktif
  const currentLocation = window.location.pathname;
  const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
  
  navLinks.forEach(link => {
    const linkPath = link.getAttribute('href');
    if (currentLocation === linkPath || 
        (linkPath !== '/' && currentLocation.startsWith(linkPath))) {
      link.classList.add('active');
    }
  });
  
  // Tambahkan animasi ke card-card di dashboard
  const animateCards = () => {
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
      card.classList.add('animate__animated', 'animate__fadeInUp');
      card.style.animationDelay = `${index * 0.1}s`;
    });
  };
  
  animateCards();
  
  // Tambahkan animasi untuk tabel data
  const animateTableRows = () => {
    const tableRows = document.querySelectorAll('tbody tr');
    tableRows.forEach((row, index) => {
      row.style.opacity = '0';
      row.style.transform = 'translateY(15px)';
      row.style.transition = 'all 0.3s ease';
      row.style.transitionDelay = `${index * 0.05}s`;
      
      setTimeout(() => {
        row.style.opacity = '1';
        row.style.transform = 'translateY(0)';
      }, 100);
    });
  };
  
  animateTableRows();
  
  // Preview gambar sebelum upload dengan efek yang lebih baik
  const imageInput = document.getElementById('image');
  if (imageInput) {
    imageInput.addEventListener('change', function() {
      const previewContainer = document.getElementById('image-preview');
      
      // Buat container preview jika belum ada
      if (!previewContainer) {
        const container = document.createElement('div');
        container.id = 'image-preview';
        container.className = 'mt-3 p-2 rounded animate__animated animate__fadeIn';
        imageInput.parentNode.appendChild(container);
      }
      
      const container = document.getElementById('image-preview');
      
      // Hapus preview sebelumnya jika ada
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      
      const file = this.files[0];
      if (file) {
        // Tambahkan loading spinner
        const loadingSpinner = document.createElement('div');
        loadingSpinner.className = 'd-flex justify-content-center mb-2';
        loadingSpinner.innerHTML = `
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        `;
        container.appendChild(loadingSpinner);
        
        const reader = new FileReader();
        reader.onload = function(e) {
          // Hapus loading spinner
          container.removeChild(loadingSpinner);
          
          const imgContainer = document.createElement('div');
          imgContainer.className = 'position-relative';
          
          const img = document.createElement('img');
          img.src = e.target.result;
          img.className = 'img-fluid rounded';
          img.style.maxHeight = '200px';
          img.style.width = 'auto';
          img.style.display = 'block';
          img.style.margin = '0 auto';
          
          const imgInfo = document.createElement('div');
          imgInfo.className = 'mt-2 text-center';
          imgInfo.innerHTML = `<small class="text-muted">${file.name} (${(file.size / 1024).toFixed(1)} KB)</small>`;
          
          const removeBtn = document.createElement('button');
          removeBtn.className = 'btn btn-sm btn-danger position-absolute top-0 end-0 m-1';
          removeBtn.innerHTML = '<i class="bi bi-x"></i>';
          removeBtn.onclick = function() {
            container.innerHTML = '';
            imageInput.value = '';
          };
          
          imgContainer.appendChild(img);
          imgContainer.appendChild(removeBtn);
          container.appendChild(imgContainer);
          container.appendChild(imgInfo);
        }
        reader.readAsDataURL(file);
      }
    });
  }
  
  // Konfirmasi hapus dengan SweetAlert2
  const deleteButtons = document.querySelectorAll('button[type="submit"][onclick*="confirm"]');
  
  if (typeof Swal !== 'undefined') {
    deleteButtons.forEach(button => {
      button.removeAttribute('onclick');
      button.addEventListener('click', function(e) {
        e.preventDefault();
        const form = this.closest('form');
        
        Swal.fire({
          title: 'Konfirmasi Hapus',
          text: 'Yakin ingin menghapus item ini?',
          icon: 'warning',
          iconColor: '#e74c3c',
          showCancelButton: true,
          confirmButtonColor: '#e74c3c',
          cancelButtonColor: '#3f4756',
          confirmButtonText: 'Ya, Hapus!',
          cancelButtonText: 'Batal',
          background: '#1a1a1a',
          color: '#fff',
          backdrop: 'rgba(0,0,0,0.7)',
          showClass: {
            popup: 'animate__animated animate__fadeInDown'
          },
          hideClass: {
            popup: 'animate__animated animate__fadeOutUp'
          }
        }).then((result) => {
          if (result.isConfirmed) {
            // Tampilkan loading
            Swal.fire({
              title: 'Menghapus...',
              html: 'Mohon tunggu sebentar',
              allowOutsideClick: false,
              showConfirmButton: false,
              willOpen: () => {
                Swal.showLoading();
              },
              background: '#1a1a1a',
              color: '#fff'
            });
            
            form.submit();
          }
        });
      });
    });
  }
  
  // Tambahkan validasi form
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      if (!form.checkValidity()) {
        e.preventDefault();
        e.stopPropagation();
        
        // Highlight fields with errors
        const invalidFields = form.querySelectorAll(':invalid');
        invalidFields.forEach(field => {
          field.classList.add('is-invalid');
          field.addEventListener('input', function() {
            this.classList.remove('is-invalid');
          });
        });
        
        // Show error notification
        if (typeof Swal !== 'undefined') {
          Swal.fire({
            title: 'Validasi Gagal',
            text: 'Mohon periksa kembali form isian Anda',
            icon: 'error',
            background: '#1a1a1a',
            color: '#fff',
            confirmButtonColor: '#3498db'
          });
        }
      } else {
        // Show loading on form submit
        if (typeof Swal !== 'undefined' && !form.classList.contains('d-inline')) {
          Swal.fire({
            title: 'Memproses...',
            html: 'Mohon tunggu sebentar',
            allowOutsideClick: false,
            showConfirmButton: false,
            willOpen: () => {
              Swal.showLoading();
            },
            background: '#1a1a1a',
            color: '#fff'
          });
        }
      }
      
      form.classList.add('was-validated');
    });
  });
}); 