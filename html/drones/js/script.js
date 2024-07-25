document.addEventListener('DOMContentLoaded', () => {
    const modals = document.querySelectorAll('.modal');
    M.Modal.init(modals);

    let drones;

    function populateDroneList() {
        const droneList = document.getElementById("drone-list");
        
        droneList.innerHTML = '';
        drones.forEach(drone => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${drone.droneID}</td><td>${drone.password}</td>`;
            droneList.appendChild(tr);
        });
    }

    $.ajax({
        url:'/fetch-drones',
        method: 'GET',
        success: function(res) {
            drones = res.drones;
	    populateDroneList();
        },
        error: function() {

        }
    }); 

    document.getElementById('add-drone').addEventListener('click', () => {
        const addModal = M.Modal.getInstance(document.getElementById('add-drone-modal'));
        addModal.open();
    });

    document.getElementById('delete-drone').addEventListener('click', () => {
        const deleteModal = M.Modal.getInstance(document.getElementById('delete-drone-modal'));
        deleteModal.open();
    });
    
    document.getElementById('add').addEventListener('click', (e) => {
        let droneID = document.getElementById('add-drone-id').value;
        let password = document.getElementById('add-drone-password').value;

	$.ajax({
            url: '/add-drone',
	    method: 'POST',
	    contentType: 'application/json',
            data: JSON.stringify({ droneID: droneID, password: password }),
	    success: function(res) {
                alert('Success! Drone added!');
                window.location.reload();
	    },
	    error: function() {
		alert('Error! Try again');
	   }
	});
    });
    
    document.getElementById('delete').addEventListener('click', (e) => {
        let droneID = document.getElementById('delete-drone-id').value;

        $.ajax({
            url: '/delete-drone',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ droneID: droneID }),
            success: function(res) {
                alert('Success! Drone delete!');
                window.location.reload();
	    },
            error: function() {
                alert('Error! Try again');
           }
        });
    });

    document.getElementById('search').addEventListener('input', function() {
        const searchValue = this.value.toLowerCase();
        const filteredDrones = drones.filter(drone => drone.droneID.toLowerCase().includes(searchValue));
        
        const droneList = document.getElementById("drone-list");
        
        droneList.innerHTML = '';
        filteredDrones.forEach(drone => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${drone.droneID}</td><td>${drone.password}</td>`;
            droneList.appendChild(tr);
        });    
    });
});
