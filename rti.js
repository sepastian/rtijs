// TODO implement closures https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures

var load = function(uri){
    let xhr = new XMLHttpRequest();
    xhr.open('GET',uri,true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function(e) {
        if (this.status == 200) {
            let fr = new FileReader()
            let data = new Uint8Array(this.response)
            header = parse_header(data)
            console.log(header)
        }
    }
    xhr.send();
}

// #HSH1.2
// 3
// 2000 2000 3
// 9 2 1
// ...

// RTI_TYPE
// 0 Reserved
// 1 PTM
// 2 SH
// 3 HSH
// 4 Adaptive Basis
var parse_header = function(data){
    // Header consists of three lines, not counting comment lines.
    // Comment lines start with '#'.
    var i = 0
    var lines = []
    var line = []
    while (i < data.length) {
        // Break lines at CR LF (13 10).
        if (data[i] == 13) {
            // Foud CR; look for matching LF.
            if (i < data.length - 1 && data[i+1] == 10) {
                if (line[0] != 35) {
                    // Add non-comment line;
                    // drop comment lines.
                    lines.push(String.fromCharCode(...line))
                }
                if (lines.length == 3) {
                    // Skip final line break chars, before data.
                    i += 2
                    // Done parsing header.
                    break
                }
                // Begin new line.
                line = []
                // Skip line break chars.
                i += 2
                continue
            } else {
                console.error("Error parsing header, invalid line break.")
                throw new Error()
            }
        }
        // Push character to current line.
        line.push(data[i])
        i += 1
    }
    // Store the header found in header.spec;
    // add additional information to header.
    var header = {
        spec: {
            rti_type: parseInt(lines[0])
        }
    }
    var spec = header.spec
    var tmp = lines[1].split(' ').map(x => parseInt(x))
    spec.image_witdh      = tmp[0]
    spec.image_height     = tmp[1]
    spec.color_dimensions = tmp[2]
    tmp = lines[2].split(' ').map(x => parseInt(x))
    spec.basis_terms  = tmp[0]
    spec.basis_type   = tmp[1]
    spec.element_size = tmp[2]
    // Additional information.
    // Index of first data bit/end of header.
    header.data_index = i
    // RTI type as string.
    header.rti_type_str = ['reserved','ptm','sh','hsh','adaptive_basis'][spec.rti_type]
    // Basis type as string.
    header.basis_type_str = ['lrgb','rgb'][spec.basis_type-1]
    // Nr of terms, depending on basis type.
    header.total_number_of_terms = spec.basis_type == 1 ? spec.basis_terms + spec.color_dimensions : spec.basis_terms * spec.color_dimensions
    // TODO: parse basis_functions, if rti_type == 4 (adaptive basis)
    if (header.rti_type == 4) {
        throw new Error("RTI Type 4 (adaptive basis) is not currently supported.")
    }
    return header
}
