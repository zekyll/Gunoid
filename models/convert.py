import glob
import os

if "models" in os.listdir("."):
	print("Running script in models directory.")
	os.chdir("models")
print("Directory: " +os.getcwd())

objFiles = glob.glob('*.obj')
if len(objFiles) == 0:
	print("No .obj files found. Are you running convert in correct directory?")
	exit()

output = open("../modeldata.js", "w")
output.write("\n\"use strict\";\n\n")
output.write("var modelData =\n")
output.write("{\n")

print("\nFiles:")
for fileIdx, filename in enumerate(objFiles):
	print(filename)
	file = open(filename, "r");
	vertices = []
	edges = []
	faces = []
	if fileIdx > 0:
		output.write("\n")
	output.write("\t" + os.path.splitext(filename)[0] + ": [\n")
	for line in file:
		if len(line) > 0 and line[0] == "#":
			continue
		tokens = line.split()
		if tokens[0] == "v":
			vertices.append([float(x) for x in tokens[1:3]])
		if tokens[0] == "l":
			edges.append([int(tokens[1]) - 1, int(tokens[2]) - 1])
		if tokens[0] == "f":
			faces.append([int(tokens[1]) - 1, int(tokens[2]) - 1, int(tokens[3]) - 1])
	if len(edges) > 0 and len(faces) > 0:
		print("Can't convert a model that contains both edges and faces!")
	for eIdx, e in enumerate(edges):
		output.write("\t\t%.3f, %.3f, %.3f, %.3f" %
			(vertices[e[0]][0], vertices[e[0]][1],
			vertices[e[1]][0], vertices[e[1]][1]))
		output.write(",\n" if eIdx < len(edges) - 1 else "\n")
	for fIdx, f in enumerate(faces):
		output.write("\t\t%.3f, %.3f, %.3f, %.3f, %.3f, %.3f" %
			(vertices[f[0]][0], vertices[f[0]][1],
			vertices[f[1]][0], vertices[f[1]][1],
			vertices[f[2]][0], vertices[f[2]][1]))
		output.write(",\n" if fIdx < len(faces) - 1 else "\n")
	if fileIdx < len(objFiles) - 1:
		output.write("\t],\n")
	else:
		output.write("\t]\n")
	file.close()

output.write("};\n")
output.close()

print("\nData written in ../modeldata.js.");
