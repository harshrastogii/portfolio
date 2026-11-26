// portrait-cutout.swift: lift the subject out of a photo with Apple's Vision
// framework (the same subject lifting the Photos app uses), on this machine,
// and write it as a PNG with a transparent background. macOS 14 or later.
//
//     swift scripts/portrait-cutout.swift <input image> <output.png>
//
// Then run portrait-compose.py on the result.
import Foundation
import Vision
import CoreImage
import AppKit

let args = CommandLine.arguments
let input = URL(fileURLWithPath: args[1]), output = URL(fileURLWithPath: args[2])
guard let ci = CIImage(contentsOf: input) else { fatalError("cannot read input") }
let handler = VNImageRequestHandler(ciImage: ci)
let req = VNGenerateForegroundInstanceMaskRequest()
try handler.perform([req])
guard let obs = req.results?.first else { fatalError("no subject found") }
let buf = try obs.generateMaskedImage(ofInstances: obs.allInstances, from: handler, croppedToInstancesExtent: false)
let out = CIImage(cvPixelBuffer: buf)
let ctx = CIContext()
try ctx.writePNGRepresentation(of: out, to: output, format: .RGBA8, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)
print("instances:", obs.allInstances.count)
