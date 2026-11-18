import { useEffect, useMemo } from "react";
import { BufferAttribute, BufferGeometry, Color, Vector2, type Texture } from "three";
import { rimBlocks } from "../../content/ferry-site";
import { geologyNoise, groundHeight } from "./simulation";

// The sharp, shared strike survives at distance. Up close, shelf offsets,
// chipped corners and a few narrow dark bedding planes break up the faces.
function fractureMesh() {
  const positions: number[] = [], colors: number[] = [], uv: number[] = [];
  const perimeter = [[-.89,-.41],[-.31,-.82],[.74,-.74],[1.02,-.19],[.82,.71],[.17,.90],[-.92,.52]];
  const levels = [[-1.12,1.06], [.12,1.12], [.25,1.045], [.28,1.065], [.53,.95],
    [.55,.92], [.58,.945], [.77,.825], [.79,.84], [.96,.70]];
  for (const [blockIndex, block] of rimBlocks.entries()) {
    const base = groundHeight(block.x, block.z);
    const c = Math.cos(block.angle), s = Math.sin(block.angle);
    const rows: number[][][] = [];
    for (const [h, radius] of levels) {
      const row = [];
      for (let side = 0; side < perimeter.length; side++) {
        const a = perimeter[side], b = perimeter[(side+1)%perimeter.length];
        for (let k = 0; k < 5; k++) {
          const t = k/5, u = a[0]+(b[0]-a[0])*t, v = a[1]+(b[1]-a[1])*t;
          const noise = geologyNoise(u*4.5+block.x, v*5.2+h*2.3);
          const r = block.radius*(radius+.27*(noise-.5));
          const x = u*r*1.02 + h*.23, z = v*r*.81;
          const y = base + block.height*(h + .17*u - .08*v + .17*(noise-.5));
          row.push([block.x + c*x+s*z, y, block.z - s*x+c*z]);
        }
      }
      rows.push(row);
    }
    const tint = new Color();
    function triangle(a: number[], b: number[], d: number[], brightness: number, top = false) {
      const dx = d[0]-a[0], dz = d[2]-a[2];
      // The first two points can form the vertical edge on either triangle.
      const ex=b[0]-a[0], ey=b[1]-a[1], ez=b[2]-a[2];
      const dy=d[1]-a[1];
      const alongZ = Math.abs(ey*dz-ez*dy) > Math.abs(ex*dy-ey*dx);
      for (const p of [a,b,d]) {
        const [x,y,z] = p;
        const mineral = .82 + .3*geologyNoise(x*3+y*.6,z*4);
        const value = brightness*mineral;
        tint.setRGB(value*1.02,value*.96,value*.91);
        positions.push(x,y,z); colors.push(tint.r,tint.g,tint.b);
        uv.push((alongZ && !top ? z-block.z : x-block.x)*.19+.53, top ? (z-block.z)*.19+.48 : (y-base)*.19+.12);
      }
    }
    for(let j=0; j<rows.length-1; j++){
      const band = j===2 || j===5 ? .48 : .67 + .14*geologyNoise(j+blockIndex,2);
      for(let i=0;i<rows[j].length;i++){
        const n=(i+1)%rows[j].length;
        triangle(rows[j][i],rows[j+1][i],rows[j+1][n],band);
        triangle(rows[j][i],rows[j+1][n],rows[j][n],band);
      }
    }
    const crown = rows[rows.length-1];
    for(let i=0;i<crown.length;i++) triangle(crown[i],[block.x+.28,base+block.height,block.z],crown[(i+1)%crown.length],.48,true);
  }
  const mesh = new BufferGeometry();
  mesh.setAttribute("position",new BufferAttribute(new Float32Array(positions),3));
  mesh.setAttribute("color",new BufferAttribute(new Float32Array(colors),3));
  mesh.setAttribute("uv",new BufferAttribute(new Float32Array(uv),2));
  mesh.computeVertexNormals();
  return mesh;
}
export function RimOutcrop({ soil, normal, strata }: { soil: Texture; normal: Texture; strata: Texture | null }) {
  const mesh = useMemo(() => fractureMesh(), []);
  useEffect(() => () => mesh.dispose(), [mesh]);
  return <mesh geometry={mesh} castShadow receiveShadow>
    <meshStandardMaterial vertexColors map={strata ?? soil} bumpMap={strata} bumpScale={.15} normalMap={normal} normalScale={new Vector2(.52,.52)} roughness={.94}/>
  </mesh>;
}
