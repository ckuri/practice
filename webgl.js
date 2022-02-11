var VSHADER_SOURCE = `
    attribute vec4 a_Position;
    attribute vec4 a_Normal;
    uniform mat4 u_MvpMatrix;
    uniform mat4 u_modelMatrix;
    uniform mat4 u_normalMatrix;
    uniform mat4 u_ProjMatrixFromLight;
    varying vec3 v_Normal;
    varying vec3 v_PositionInWorld;

    uniform mat4 u_MvpMatrixOfLight;
    varying vec4 v_PositionFromLight;
    varying mat4 v_MvpMatrix;

    attribute vec2 a_TexCoord;
    varying vec2 v_TexCoord;

    void main(){
        gl_Position = u_MvpMatrix * a_Position;
        v_PositionInWorld = (u_modelMatrix * a_Position).xyz; 
        v_Normal = normalize(vec3(u_normalMatrix * a_Normal));

        //Calculate the coordinate of the clip space from LIGHT of the object poin
        v_PositionFromLight = u_MvpMatrixOfLight * a_Position; //for shadow

        v_TexCoord = a_TexCoord;
       // v_MvpMatrix = u_MvpMatrix;
    }    
`;
var FSHADER_SOURCE = `
    precision mediump float;

    uniform vec3 u_LightPosition;
    uniform vec3 u_ViewPosition;
    uniform float u_Ka;
    uniform float u_Kd;
    uniform float u_Ks;
    uniform float u_shininess;
    uniform vec3 u_Color;
    uniform sampler2D u_ShadowMap;
    //
    uniform sampler2D u_Sampler1;
    varying vec2 v_TexCoord;
    uniform float u_TexBool;

    varying vec3 v_Normal;
    varying vec3 v_PositionInWorld;
    varying vec4 v_PositionFromLight;

    const float deMachThreshold = 0.005; //0.001 if having high precision depth
    void main(){ 
        vec3 texColor = u_Color;
        vec3 ambientLightColor = u_Color;
        vec3 diffuseLightColor = u_Color;
        
        if(u_TexBool == 1.0){
            texColor = texture2D(u_Sampler1, v_TexCoord).rgb;
            ambientLightColor = texColor;
            diffuseLightColor = texColor;
        } 
        
        
        vec3 specularLightColor = vec3(1.0, 1.0, 1.0);     
        vec3 ambient = ambientLightColor * u_Ka;

        vec3 normal = normalize(v_Normal);
        vec3 lightDirection = normalize(u_LightPosition - v_PositionInWorld);
        float nDotL = max(dot(lightDirection, normal), 0.0);
        vec3 diffuse = diffuseLightColor * u_Kd * nDotL;

        vec3 specular = vec3(0.0, 0.0, 0.0);
        if(nDotL > 0.0) {
            vec3 R = reflect(-lightDirection, normal);
            // V: the vector, point to viewer       
            vec3 V = normalize(u_ViewPosition - v_PositionInWorld); 
            float specAngle = clamp(dot(R, V), 0.0, 1.0);
            specular = u_Ks * pow(specAngle, u_shininess) * specularLightColor; 
        }

        float visibility = 1.0;
        gl_FragColor = vec4( (ambient + diffuse + specular)*visibility, 1.0);
    }
`;
var VSHADER_SOURCE2 = `
    attribute vec4 a_Position;
    attribute vec4 a_Normal;
    uniform mat4 u_MvpMatrix;
    uniform mat4 u_modelMatrix;
    uniform mat4 u_normalMatrix;
    varying vec3 v_Normal;
    varying vec3 v_PositionInWorld;
    void main(){
        gl_Position = u_MvpMatrix * a_Position;
        v_PositionInWorld = (u_modelMatrix * a_Position).xyz; 
        v_Normal = normalize(vec3(u_normalMatrix * a_Normal));
        // gl_Position  = vec4(0.0,0.0,0.0,1.0);
        // gl_PointSize = 10.0;
    }    
`;
var FSHADER_SOURCE2 = `
    precision mediump float;
    uniform vec3 u_LightPosition;
    uniform vec3 u_ViewPosition;
    uniform float u_Ka;
    uniform float u_Kd;
    uniform float u_Ks;
    uniform vec3 u_Color;
    uniform float u_shininess;
    varying vec3 v_Normal;
    varying vec3 v_PositionInWorld;
    void main(){
        // (you can also input them from ouside and make them different)
        vec3 ambientLightColor = u_Color.rgb;
        vec3 diffuseLightColor = u_Color.rgb;
        // assume white specular light (you can also input it from ouside)
        vec3 specularLightColor = vec3(1.0, 1.0, 1.0);        

        vec3 ambient = ambientLightColor * u_Ka;

        vec3 normal = normalize(v_Normal);
        vec3 lightDirection = normalize(u_LightPosition - v_PositionInWorld);
        float nDotL = max(dot(lightDirection, normal), 0.0);
        vec3 diffuse = diffuseLightColor * u_Kd * nDotL;

        vec3 specular = vec3(0.0, 0.0, 0.0);
        if(nDotL > 0.0) {
            vec3 R = reflect(-lightDirection, normal);
            // V: the vector, point to viewer       
            vec3 V = normalize(u_ViewPosition - v_PositionInWorld); 
            float specAngle = clamp(dot(R, V), 0.0, 1.0);
            specular = u_Ks * pow(specAngle, u_shininess) * specularLightColor; 
        }

        gl_FragColor = vec4( ambient + diffuse + specular, 1.0 );
    }
`;
var VSHADER_SHADOW_SOURCE = `
      attribute vec4 a_Position;
      uniform mat4 u_MvpMatrix;
      void main(){
          gl_Position = u_MvpMatrix * a_Position;
      }
`;
var FSHADER_SHADOW_SOURCE = `
      precision mediump float;
      void main(){
        /////////** LOW precision depth implementation **/////
        gl_FragColor = vec4(gl_FragCoord.z, 0.0, 0.0, 1.0);
      }
`;
var VSHADER_SOURCE_ENVCUBE = `
    attribute vec4 a_Position;
    varying vec4 v_Position;
    void main() {
        v_Position = a_Position;
        gl_Position = a_Position;
    } 
`;
var FSHADER_SOURCE_ENVCUBE = `
    precision mediump float;
    uniform samplerCube u_envCubeMap;
    uniform mat4 u_viewDirectionProjectionInverse;
    varying vec4 v_Position;
    void main() {
        vec4 t = u_viewDirectionProjectionInverse * v_Position;
        gl_FragColor = textureCube(u_envCubeMap, normalize(t.xyz / t.w));
    }
`;
var VSHADER_MONITOR = `
    attribute vec4 a_Position;
    attribute vec2 a_TexCoord;
    attribute vec4 a_Normal;
    //////
    attribute vec3 a_Tagent;
    attribute vec3 a_Bitagent;
    attribute float a_crossTexCoord;
    ///
    uniform mat4 u_MvpMatrix;
    uniform mat4 u_modelMatrix;
    uniform mat4 u_normalMatrix;
    varying vec3 v_PositionInWorld;
    varying vec2 v_TexCoord;
    //////
    varying mat4 v_TBN;
    ///
    varying vec3 v_Normal;
    uniform mat4 u_MvpMatrixOfLight;
    varying vec4 v_PositionFromLight;
    
    void main(){
        gl_Position = u_MvpMatrix * a_Position;
        v_PositionInWorld = (u_modelMatrix * a_Position).xyz; 
        v_Normal = normalize(vec3(u_normalMatrix * a_Normal));
        v_TexCoord = a_TexCoord;
        //create TBN matrix 
        vec3 tagent = normalize(a_Tagent);
        vec3 bitagent = normalize(a_Bitagent);
        vec3 nVector;

        v_PositionFromLight = u_MvpMatrixOfLight * a_Position; //for shadow

        ///防normal面inside outside問題//////////
        /*
        if( a_crossTexCoord > 0.0){
          nVector = cross(tagent, bitagent);
        } else{
          nVector = cross(bitagent, tagent);
        }
        ///////////////////////////////////////

        v_TBN = mat4(tagent.x, tagent.y, tagent.z, 0.0, 
                           bitagent.x, bitagent.y, bitagent.z, 0.0,
                           nVector.x, nVector.y, nVector.z, 0.0, 
                           0.0, 0.0, 0.0, 1.0);
*/
    }
`;
var FSHADER_MONITOR = `
    precision mediump float;
    uniform vec3 u_LightPosition;
    uniform vec3 u_ViewPosition;
    uniform float u_Ka;
    uniform float u_Kd;
    uniform float u_Ks;
    uniform float u_shininess;
    uniform vec3 u_Color;
    //
    uniform sampler2D u_bumpMap;

    uniform sampler2D u_Sampler1;
    //
    uniform highp mat4 u_normalMatrix;

    varying vec3 v_PositionInWorld;
    varying vec2 v_TexCoord;
    //
    varying mat4 v_TBN;

    varying vec3 v_Normal;
    uniform float u_TexBool;
    //    
    uniform float u_BumpBool;
    uniform float u_ShadowBool;

    
    varying vec4 v_PositionFromLight;
    uniform sampler2D u_ShadowMap;
    const float deMachThreshold = 0.005; //0.001 if having high precision depth


    void main(){ 

        vec3 texColor = u_Color;
        vec3 ambientLightColor = u_Color;
        vec3 diffuseLightColor = u_Color;
        
        if(u_TexBool == 1.0){
            texColor = texture2D(u_Sampler1, v_TexCoord).rgb;
            ambientLightColor = texColor;
            diffuseLightColor = texColor;
        } 
        
        vec3 specularLightColor = vec3(1.0, 1.0, 1.0);     
        vec3 ambient = ambientLightColor * u_Ka;

        vec3 normal = normalize(v_Normal);
        if(u_BumpBool == 1.0){
            vec3 nMapNormal = normalize( texture2D( u_bumpMap, v_TexCoord ).rgb * 2.0 - 1.0 );
            vec3 normal = normalize( vec3( u_normalMatrix * v_TBN * vec4( nMapNormal, 1.0) ) );
        }

        vec3 lightDirection = normalize(u_LightPosition - v_PositionInWorld);
        float nDotL = max(dot(lightDirection, normal), 0.0);
        vec3 diffuse = diffuseLightColor * u_Kd * nDotL;

        vec3 specular = vec3(0.0, 0.0, 0.0);
        if(nDotL > 0.0) {
            vec3 R = reflect(-lightDirection, normal);  
            vec3 V = normalize(u_ViewPosition - v_PositionInWorld); 
            float specAngle = clamp(dot(R, V), 0.0, 1.0);
            specular = u_Ks * pow(specAngle, u_shininess) * specularLightColor; 
        }

        float visibility = 1.0;
        //***** shadow///////////////////////////////
        if(u_ShadowBool == 1.0){
            vec3 shadowCoord = (v_PositionFromLight.xyz/v_PositionFromLight.w)/2.0 + 0.5;
            vec4 rgbaDepth = texture2D(u_ShadowMap, shadowCoord.xy);
            /////////******** LOW precision depth implementation ********///////////
            //Compare coordLightClipSpace.z and the depth of the closest object point to determine the visibility
            float depth = rgbaDepth.r;
            visibility = (shadowCoord.z > depth + deMachThreshold) ? 0.3 : 1.0;
        }
        gl_FragColor = vec4( (ambient + diffuse + specular)*visibility, 1.0);
}
`;
var V_REFLECT_CUBEMAP = `
    attribute vec4 a_Position;
    attribute vec4 a_Normal;
    uniform mat4 u_MvpMatrix;
    uniform mat4 u_modelMatrix;
    uniform mat4 u_normalMatrix;
    varying vec3 v_Normal;
    varying vec3 v_PositionInWorld;
    void main(){
        gl_Position = u_MvpMatrix * a_Position;
        v_PositionInWorld = (u_modelMatrix * a_Position).xyz; 
        v_Normal = normalize(vec3(u_normalMatrix * a_Normal));
    }    
`;
var F_REFLECT_CUBEMAP = `
    precision mediump float;
    uniform vec3 u_ViewPosition;
    uniform samplerCube u_envCubeMap;
    varying vec3 v_Normal;
    varying vec3 v_PositionInWorld;
    void main(){ 
        vec3 V = normalize(u_ViewPosition - v_PositionInWorld); 
        vec3 normal = normalize(v_Normal);
        vec3 R = reflect(-V, normal);
        gl_FragColor = vec4(textureCube(u_envCubeMap, R).rgb, 1.0);
    }
`;
var V_REFRACT_CUBEMAP = `
    attribute vec4 a_Position;
    attribute vec4 a_Normal;
    uniform mat4 u_MvpMatrix;
    uniform mat4 u_modelMatrix;
    uniform mat4 u_normalMatrix;
    varying vec3 v_Normal;
    varying vec3 v_PositionInWorld;
    void main(){
        gl_Position = u_MvpMatrix * a_Position;
        v_PositionInWorld = (u_modelMatrix * a_Position).xyz; 
        v_Normal = normalize(vec3(u_normalMatrix * a_Normal));
    }    
`;
var F_REFRACT_CUBEMAP = `
    precision mediump float;
    uniform vec3 u_ViewPosition;
    uniform samplerCube u_envCubeMap;
    varying vec3 v_Normal;
    varying vec3 v_PositionInWorld;
    void main(){
      float ratio = 1.00 / 1.1; //glass
      vec3 V = normalize(u_ViewPosition - v_PositionInWorld); 
      vec3 normal = normalize(v_Normal);
      vec3 R = refract(-V, normal, ratio);
      gl_FragColor = vec4(textureCube(u_envCubeMap, R).rgb, 1.0);
    }
`;
var V_BUMPMAP = `
    attribute vec4 a_Position;
    attribute vec2 a_TexCoord;
    attribute vec4 a_Normal;
    attribute vec3 a_Tagent;
    attribute vec3 a_Bitagent;
    attribute float a_crossTexCoord;
    uniform mat4 u_MvpMatrix;
    uniform mat4 u_modelMatrix;
    uniform mat4 u_normalMatrix;
    varying vec3 v_PositionInWorld;
    varying vec2 v_TexCoord;
    varying mat4 v_TBN;
    varying vec3 v_Normal;

    uniform mat4 u_MvpMatrixOfLight;
    varying vec4 v_PositionFromLight;


    void main(){
        gl_Position = u_MvpMatrix * a_Position;
        v_PositionInWorld = (u_modelMatrix * a_Position).xyz; 
        v_Normal = normalize(vec3(u_normalMatrix * a_Normal));
        v_TexCoord = a_TexCoord;
        //create TBN matrix 
        vec3 tagent = normalize(a_Tagent);
        vec3 bitagent = normalize(a_Bitagent);
        vec3 nVector;

        v_PositionFromLight = u_MvpMatrixOfLight * a_Position; //for shadow

        ///防normal面inside outside問題//////////
        if( a_crossTexCoord > 0.0){
          nVector = cross(tagent, bitagent);
        } else{
          nVector = cross(bitagent, tagent);
        }
        ///////////////////////////////////////

        v_TBN = mat4(tagent.x, tagent.y, tagent.z, 0.0, 
                           bitagent.x, bitagent.y, bitagent.z, 0.0,
                           nVector.x, nVector.y, nVector.z, 0.0, 
                           0.0, 0.0, 0.0, 1.0);
    }    
`;
var F_BUMPMAP = `
    precision mediump float;
    uniform vec3 u_LightPosition;
    uniform vec3 u_ViewPosition;
    uniform float u_Ka;
    uniform float u_Kd;
    uniform float u_Ks;
    uniform vec3 u_Color;
    uniform float u_shininess;
    uniform sampler2D u_bumpMap;
    uniform sampler2D u_Sampler1;
    uniform highp mat4 u_normalMatrix;
    varying vec3 v_PositionInWorld;
    varying vec2 v_TexCoord;
    varying mat4 v_TBN;
    varying vec3 v_Normal;

    uniform float u_TexBool;
    uniform float u_BumpBool;
    uniform float u_ShadowBool;

    varying vec4 v_PositionFromLight;
    uniform sampler2D u_ShadowMap;
    const float deMachThreshold = 0.005; //0.001 if having high precision depth

    void main(){

        vec3 texColor = u_Color;
        if(u_TexBool == 1.0){
            texColor = texture2D(u_Sampler1, v_TexCoord).rgb;
        }
   
        vec3 ambientLightColor = texColor;
        vec3 diffuseLightColor = texColor;
        
        vec3 specularLightColor = vec3(1.0, 1.0, 1.0);        

        vec3 ambient = ambientLightColor * u_Ka ;

        //normal vector from normal map

        vec3 normal = normalize(v_Normal);
        if(u_BumpBool == 1.0){
            vec3 nMapNormal = normalize( texture2D( u_bumpMap, v_TexCoord ).rgb * 2.0 - 1.0 );
            normal = normalize( vec3( u_normalMatrix * v_TBN * vec4( nMapNormal, 1.0) ) );
        }
        
        vec3 lightDirection = normalize(u_LightPosition - v_PositionInWorld);
        float nDotL = max(dot(lightDirection, normal), 0.0);
        vec3 diffuse = diffuseLightColor * u_Kd * nDotL;


        vec3 specular = vec3(0.0, 0.0, 0.0);
        if(nDotL > 0.0) {
            vec3 R = reflect(-lightDirection, normal);
    
            vec3 V = normalize(u_ViewPosition - v_PositionInWorld); 
            float specAngle = clamp(dot(R, V), 0.0, 1.0);
            specular = u_Ks * pow(specAngle, u_shininess) * specularLightColor; 
        }

        float visibility = 1.0;
        //***** shadow///////////////////////////////
        if(u_ShadowBool == 1.0){
            vec3 shadowCoord = (v_PositionFromLight.xyz/v_PositionFromLight.w)/2.0 + 0.5;
            vec4 rgbaDepth = texture2D(u_ShadowMap, shadowCoord.xy);
            /////////******** LOW precision depth implementation ********///////////
            //Compare coordLightClipSpace.z and the depth of the closest object point to determine the visibility
            float depth = rgbaDepth.r;
            visibility = (shadowCoord.z > depth + deMachThreshold) ? 0.43 : 1.0;
        }


        gl_FragColor = vec4( (ambient + diffuse + specular)*visibility, 1.0);
    }
`;
var VSHADER_SOURCE_TEXTURE_ON_CUBE = `
  attribute vec4 a_Position;
  attribute vec4 a_Normal;
  uniform mat4 u_MvpMatrix;
  uniform mat4 u_modelMatrix;
  uniform mat4 u_normalMatrix;
  varying vec4 v_TexCoord;
  varying vec3 v_Normal;
  varying vec3 v_PositionInWorld;
  void main() {
    gl_Position = u_MvpMatrix * a_Position;
    v_TexCoord = a_Position;
    v_PositionInWorld = (u_modelMatrix * a_Position).xyz; 
    v_Normal = normalize(vec3(u_normalMatrix * a_Normal));
  } 
`;
var FSHADER_SOURCE_TEXTURE_ON_CUBE = `
  precision mediump float;
  varying vec4 v_TexCoord;
  uniform vec3 u_ViewPosition;
  uniform vec3 u_Color;
  uniform samplerCube u_envCubeMap;
  varying vec3 v_Normal;
  varying vec3 v_PositionInWorld;
  void main() {
    vec3 V = normalize(u_ViewPosition - v_PositionInWorld); 
    vec3 normal = normalize(v_Normal);
    vec3 R = reflect(-V, normal);
    gl_FragColor = vec4(0.78 * textureCube(u_envCubeMap, R).rgb + 0.3 * u_Color, 1.0);
  }
`;

function compileShader(gl, vShaderText, fShaderText) {
    var vertexShader = gl.createShader(gl.VERTEX_SHADER)
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
    gl.shaderSource(vertexShader, vShaderText)
    gl.shaderSource(fragmentShader, fShaderText)
    gl.compileShader(vertexShader)
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.log('vertex shader ereror');
        var message = gl.getShaderInfoLog(vertexShader);
        console.log(message); //print shader compiling error message
    }
    gl.compileShader(fragmentShader)
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.log('fragment shader ereror');
        var message = gl.getShaderInfoLog(fragmentShader);
        console.log(message); //print shader compiling error message
    }
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        alert(gl.getProgramInfoLog(program) + "");
        gl.deleteProgram(program);
    }
    return program;
}

function initAttributeVariable(gl, a_attribute, buffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, buffer.num, buffer.type, false, 0, 0);
    gl.enableVertexAttribArray(a_attribute);
}

function initArrayBufferForLaterUse(gl, data, num, type) {
    // Create a buffer object
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create the buffer object');
        return null;
    }
    // Write date into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    // Store the necessary information to assign the object to the attribute variable later
    buffer.num = num;
    buffer.type = type;

    return buffer;
}

function initVertexBufferForLaterUse(gl, vertices, normals, texCoords, tagents, bitagents, crossTexCoords) {
    var nVertices = vertices.length / 3;

    var o = new Object();
    o.vertexBuffer = initArrayBufferForLaterUse(gl, new Float32Array(vertices), 3, gl.FLOAT);
    if (normals != null) o.normalBuffer = initArrayBufferForLaterUse(gl, new Float32Array(normals), 3, gl.FLOAT);
    if (texCoords != null) o.texCoordBuffer = initArrayBufferForLaterUse(gl, new Float32Array(texCoords), 2, gl.FLOAT);
    if (tagents != null) o.tagentsBuffer = initArrayBufferForLaterUse(gl, new Float32Array(tagents), 3, gl.FLOAT);
    if (bitagents != null) o.bitagentsBuffer = initArrayBufferForLaterUse(gl, new Float32Array(bitagents), 3, gl.FLOAT);
    if (crossTexCoords != null) o.crossTexCoordsBuffer = initArrayBufferForLaterUse(gl, new Float32Array(crossTexCoords), 1, gl.FLOAT);
    //you can have error check here
    o.numVertices = nVertices;

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return o;
}

var mouseLastX, mouseLastY;
var mouseDragging = false;
var angleX = 0,
    angleY = 0;
var gl, canvas;
var modelMatrix;
var normalMatrix;
var nVertex;
var playerX = 0,
    playerY = 0.3,
    playerZ = 5;
var cameraX = playerX + 0,
    cameraY = playerY + 1.9,
    cameraZ = playerZ + 1.0;

var lightX = -0.8,
    lightY = 4,
    lightZ = 5;
var fox;
var bench;
var cubeObj;
var sphereObj;

var cube = [];
var monitor = [];
var sphere = [];

var offScreenWidth = 2048,
    offScreenHeight = 2048;

var fbo;
var monitorFbo;
var dynamicFbo;
//////////
var cubeMapTex;
var quadObj;
var cameraDirX = 0,
    cameraDirY = -0.1,
    cameraDirZ = -1;
var newViewDir;
////Texture
var textures = {};
var imgNames = ["texture.png", "Bench.jpg", "t1.jpg", "test3_1.jpg", "g.png"];
var foxCompImgIndex = ["texture.png"];
var benchCompImgIndex = ["Bench.jpg"];
var groundCompImgIndex = ["t1.jpg"];
var groundNormal = ["test3_1.jpg"];
var guitarCompImgIndex = ["g.png"];
var texCount = 0;
var numTextures = imgNames.length;

foxMdlMatrix = new Matrix4();
benchMdlMatrix = new Matrix4();
groupStack1 = [];
var povMode = 0;

////
var rotateAngle = 0;
var objScale = 0.03;
var cameraX2 = 0,
    cameraY2 = 3.5,
    cameraZ2 = 8;

var cameraX3 = 0.0,
    cameraY3 = 8.0,
    cameraZ3 = 8.0;

var rx = -2.0,
    ry = 1.0,
    rz = 0.5;
async function main() {
    canvas = document.getElementById('webgl');
    gl = canvas.getContext('webgl2');
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
    /////////Cube Map program setup////////////
    var quad = new Float32Array(
        [-1, -1, 1,
            1, -1, 1, -1, 1, 1, -1, 1, 1,
            1, -1, 1,
            1, 1, 1
        ]);
    programEnvCube = compileShader(gl, VSHADER_SOURCE_ENVCUBE, FSHADER_SOURCE_ENVCUBE);
    programEnvCube.a_Position = gl.getAttribLocation(programEnvCube, 'a_Position');
    programEnvCube.u_envCubeMap = gl.getUniformLocation(programEnvCube, 'u_envCubeMap');
    programEnvCube.u_viewDirectionProjectionInverse = gl.getUniformLocation(programEnvCube, 'u_viewDirectionProjectionInverse');
    quadObj = initVertexBufferForLaterUse(gl, quad);
    cubeMapTex = initCubeTexture("posx2.jpg", "negx2.jpg", "posy2.jpg", "negy2.jpg", "posz2.jpg", "negz2.jpg", 512, 512);

    //setup shadow shaders and prepare shader variables
    shadowProgram = compileShader(gl, VSHADER_SHADOW_SOURCE, FSHADER_SHADOW_SOURCE);
    shadowProgram.a_Position = gl.getAttribLocation(shadowProgram, 'a_Position');
    shadowProgram.u_MvpMatrix = gl.getUniformLocation(shadowProgram, 'u_MvpMatrix');
    //rendering default program
    program = compileShader(gl, VSHADER_SOURCE, FSHADER_SOURCE);
    program.a_Position = gl.getAttribLocation(program, 'a_Position');
    program.a_Normal = gl.getAttribLocation(program, 'a_Normal');
    program.u_MvpMatrix = gl.getUniformLocation(program, 'u_MvpMatrix');
    program.u_modelMatrix = gl.getUniformLocation(program, 'u_modelMatrix');
    program.u_normalMatrix = gl.getUniformLocation(program, 'u_normalMatrix');
    program.u_LightPosition = gl.getUniformLocation(program, 'u_LightPosition');
    program.u_ViewPosition = gl.getUniformLocation(program, 'u_ViewPosition');
    program.u_MvpMatrixOfLight = gl.getUniformLocation(program, 'u_MvpMatrixOfLight');
    program.u_Ka = gl.getUniformLocation(program, 'u_Ka');
    program.u_Kd = gl.getUniformLocation(program, 'u_Kd');
    program.u_Ks = gl.getUniformLocation(program, 'u_Ks');
    program.u_shininess = gl.getUniformLocation(program, 'u_shininess');
    program.u_ShadowMap = gl.getUniformLocation(program, "u_ShadowMap");
    program.u_Color = gl.getUniformLocation(program, 'u_Color');
    program.a_TexCoord = gl.getAttribLocation(program, 'a_TexCoord');
    program.u_TexBool = gl.getUniformLocation(program, 'u_TexBool');
    program.u_Sampler1 = gl.getUniformLocation(program, "u_Sampler1");

    /////////////monitorProgram的渲染方式跟program的一模一樣
    monitorProgram = compileShader(gl, VSHADER_MONITOR, FSHADER_MONITOR);
    monitorProgram.a_Position = gl.getAttribLocation(monitorProgram, 'a_Position');
    monitorProgram.a_Normal = gl.getAttribLocation(monitorProgram, 'a_Normal');
    monitorProgram.a_TexCoord = gl.getAttribLocation(monitorProgram, 'a_TexCoord');
    monitorProgram.a_Tagent = gl.getAttribLocation(monitorProgram, 'a_Tagent');
    monitorProgram.a_Bitagent = gl.getAttribLocation(monitorProgram, 'a_Bitagent');
    monitorProgram.a_crossTexCoord = gl.getAttribLocation(monitorProgram, 'a_crossTexCoord');
    monitorProgram.u_MvpMatrix = gl.getUniformLocation(monitorProgram, 'u_MvpMatrix');
    monitorProgram.u_modelMatrix = gl.getUniformLocation(monitorProgram, 'u_modelMatrix');
    monitorProgram.u_normalMatrix = gl.getUniformLocation(monitorProgram, 'u_normalMatrix');
    monitorProgram.u_LightPosition = gl.getUniformLocation(monitorProgram, 'u_LightPosition');
    monitorProgram.u_ViewPosition = gl.getUniformLocation(monitorProgram, 'u_ViewPosition');
    monitorProgram.u_Ka = gl.getUniformLocation(monitorProgram, 'u_Ka');
    monitorProgram.u_Kd = gl.getUniformLocation(monitorProgram, 'u_Kd');
    monitorProgram.u_Ks = gl.getUniformLocation(monitorProgram, 'u_Ks');
    monitorProgram.u_Color = gl.getUniformLocation(monitorProgram, 'u_Color');
    monitorProgram.u_shininess = gl.getUniformLocation(monitorProgram, 'u_shininess');

    monitorProgram.u_MvpMatrixOfLight = gl.getUniformLocation(monitorProgram, 'u_MvpMatrixOfLight');
    monitorProgram.u_ShadowMap = gl.getUniformLocation(monitorProgram, "u_ShadowMap");
    monitorProgram.u_ShadowBool = gl.getUniformLocation(monitorProgram, "u_ShadowBool");

    monitorProgram.u_bumpMap = gl.getUniformLocation(monitorProgram, 'u_bumpMap');
    monitorProgram.u_Sampler1 = gl.getUniformLocation(monitorProgram, 'u_Sampler1');
    monitorProgram.u_TexBool = gl.getUniformLocation(monitorProgram, 'u_TexBool');
    monitorProgram.u_BumpBool = gl.getUniformLocation(monitorProgram, 'u_BumpBool');


    //////////////////////////reflection/////////
    environment_reflectProgram = compileShader(gl, V_REFLECT_CUBEMAP, F_REFLECT_CUBEMAP);
    environment_reflectProgram.a_Position = gl.getAttribLocation(environment_reflectProgram, 'a_Position');
    environment_reflectProgram.a_Normal = gl.getAttribLocation(environment_reflectProgram, 'a_Normal');
    environment_reflectProgram.u_MvpMatrix = gl.getUniformLocation(environment_reflectProgram, 'u_MvpMatrix');
    environment_reflectProgram.u_modelMatrix = gl.getUniformLocation(environment_reflectProgram, 'u_modelMatrix');
    environment_reflectProgram.u_normalMatrix = gl.getUniformLocation(environment_reflectProgram, 'u_normalMatrix');
    environment_reflectProgram.u_ViewPosition = gl.getUniformLocation(environment_reflectProgram, 'u_ViewPosition');
    environment_reflectProgram.u_envCubeMap = gl.getUniformLocation(environment_reflectProgram, 'u_envCubeMap');
    /////////////////refraction///////////
    //////////////////////////refract/////////
    environment_refractProgram = compileShader(gl, V_REFRACT_CUBEMAP, F_REFRACT_CUBEMAP);
    environment_refractProgram.a_Position = gl.getAttribLocation(environment_refractProgram, 'a_Position');
    environment_refractProgram.a_Normal = gl.getAttribLocation(environment_refractProgram, 'a_Normal');
    environment_refractProgram.u_MvpMatrix = gl.getUniformLocation(environment_refractProgram, 'u_MvpMatrix');
    environment_refractProgram.u_modelMatrix = gl.getUniformLocation(environment_refractProgram, 'u_modelMatrix');
    environment_refractProgram.u_normalMatrix = gl.getUniformLocation(environment_refractProgram, 'u_normalMatrix');
    environment_refractProgram.u_ViewPosition = gl.getUniformLocation(environment_refractProgram, 'u_ViewPosition');
    environment_refractProgram.u_envCubeMap = gl.getUniformLocation(environment_refractProgram, 'u_envCubeMap');
    ////////
    defaultProgram = compileShader(gl, V_BUMPMAP, F_BUMPMAP);
    defaultProgram.a_Position = gl.getAttribLocation(defaultProgram, 'a_Position');
    defaultProgram.a_Normal = gl.getAttribLocation(defaultProgram, 'a_Normal');
    defaultProgram.a_TexCoord = gl.getAttribLocation(defaultProgram, 'a_TexCoord');
    defaultProgram.a_Tagent = gl.getAttribLocation(defaultProgram, 'a_Tagent');
    defaultProgram.a_Bitagent = gl.getAttribLocation(defaultProgram, 'a_Bitagent');
    defaultProgram.a_crossTexCoord = gl.getAttribLocation(defaultProgram, 'a_crossTexCoord');
    defaultProgram.u_MvpMatrix = gl.getUniformLocation(defaultProgram, 'u_MvpMatrix');
    defaultProgram.u_modelMatrix = gl.getUniformLocation(defaultProgram, 'u_modelMatrix');
    defaultProgram.u_normalMatrix = gl.getUniformLocation(defaultProgram, 'u_normalMatrix');
    defaultProgram.u_LightPosition = gl.getUniformLocation(defaultProgram, 'u_LightPosition');
    defaultProgram.u_ViewPosition = gl.getUniformLocation(defaultProgram, 'u_ViewPosition');
    defaultProgram.u_Ka = gl.getUniformLocation(defaultProgram, 'u_Ka');
    defaultProgram.u_Kd = gl.getUniformLocation(defaultProgram, 'u_Kd');
    defaultProgram.u_Ks = gl.getUniformLocation(defaultProgram, 'u_Ks');
    defaultProgram.u_Color = gl.getUniformLocation(defaultProgram, 'u_Color');
    defaultProgram.u_shininess = gl.getUniformLocation(defaultProgram, 'u_shininess');

    defaultProgram.u_MvpMatrixOfLight = gl.getUniformLocation(defaultProgram, 'u_MvpMatrixOfLight');
    defaultProgram.u_ShadowMap = gl.getUniformLocation(defaultProgram, "u_ShadowMap");
    defaultProgram.u_ShadowBool = gl.getUniformLocation(defaultProgram, "u_ShadowBool");

    defaultProgram.u_bumpMap = gl.getUniformLocation(defaultProgram, 'u_bumpMap');
    defaultProgram.u_Sampler1 = gl.getUniformLocation(defaultProgram, 'u_Sampler1');
    defaultProgram.u_TexBool = gl.getUniformLocation(defaultProgram, 'u_TexBool');
    defaultProgram.u_BumpBool = gl.getUniformLocation(defaultProgram, 'u_BumpBool');

    ////////////
    programTextureOnCube = compileShader(gl, VSHADER_SOURCE_TEXTURE_ON_CUBE, FSHADER_SOURCE_TEXTURE_ON_CUBE);
    programTextureOnCube.a_Position = gl.getAttribLocation(programTextureOnCube, 'a_Position');
    programTextureOnCube.a_Normal = gl.getAttribLocation(programTextureOnCube, 'a_Normal');
    programTextureOnCube.u_MvpMatrix = gl.getUniformLocation(programTextureOnCube, 'u_MvpMatrix');
    programTextureOnCube.u_modelMatrix = gl.getUniformLocation(programTextureOnCube, 'u_modelMatrix');
    programTextureOnCube.u_normalMatrix = gl.getUniformLocation(programTextureOnCube, 'u_normalMatrix');
    programTextureOnCube.u_ViewPosition = gl.getUniformLocation(programTextureOnCube, 'u_ViewPosition');
    programTextureOnCube.u_envCubeMap = gl.getUniformLocation(programTextureOnCube, 'u_envCubeMap');
    programTextureOnCube.u_Color = gl.getUniformLocation(programTextureOnCube, 'u_Color');
    //////////
    program2 = compileShader(gl, VSHADER_SOURCE2, FSHADER_SOURCE2);
    program2.a_Position = gl.getAttribLocation(program2, 'a_Position');
    program2.a_Normal = gl.getAttribLocation(program2, 'a_Normal');
    program2.u_MvpMatrix = gl.getUniformLocation(program2, 'u_MvpMatrix');
    program2.u_modelMatrix = gl.getUniformLocation(program2, 'u_modelMatrix');
    program2.u_normalMatrix = gl.getUniformLocation(program2, 'u_normalMatrix');
    program2.u_LightPosition = gl.getUniformLocation(program2, 'u_LightPosition');
    program2.u_ViewPosition = gl.getUniformLocation(program2, 'u_ViewPosition');
    program2.u_Ka = gl.getUniformLocation(program2, 'u_Ka');
    program2.u_Kd = gl.getUniformLocation(program2, 'u_Kd');
    program2.u_Ks = gl.getUniformLocation(program2, 'u_Ks');
    program2.u_Color = gl.getUniformLocation(program2, 'u_Color');
    program2.u_shininess = gl.getUniformLocation(program2, 'u_shininess');

    fox = await loadOBJtoCreateVBO('fox.obj');
    bench = await loadOBJtoCreateVBO('bench.obj');
    cubeObj = await loadOBJtoCreateVBO('cube.obj');
    sphereObj = await loadOBJtoCreateVBO('sphere.obj');
    fishA = await loadOBJtoCreateVBO('TropicalFish01.obj');
    fishB = await loadOBJtoCreateVBO('TropicalFish12.obj');
    tv = await loadOBJtoCreateVBO('old_tv.obj');

    whale = await loadOBJtoCreateVBO('whale.obj');
    gFish = await loadOBJtoCreateVBO('GoldenFish.obj');

    guitar = await loadOBJtoCreateVBO('Guitar.obj');

    //callCube();
    callQuad();
    //callSphere();

    for (let i = 0; i < imgNames.length; i++) {
        let image = new Image();
        image.onload = function() { initTexture(gl, image, imgNames[i]); };
        image.src = imgNames[i];
    }
    ////////////////Textures
    var normalMapImage = new Image();
    normalMapImage.onload = function() { initTexture(gl, normalMapImage, "normalMapImage"); };
    normalMapImage.src = "test3_1.jpg";
    var texImage01 = new Image();
    texImage01.onload = function() { initTexture(gl, texImage01, "tex01"); };
    texImage01.src = "t1.jpg";

    fbo = initFrameBuffer(gl);
    monitorFbo = initFrameBuffer(gl);
    dynamicFbo = initFrameBufferForCubemapRendering(gl);

    mvpMatrix = new Matrix4();
    modelMatrix = new Matrix4();
    normalMatrix = new Matrix4();
    if (povMode == 0) {
        drawA();
    } else {
        drawB();
    }
    canvas.onmousedown = function(ev) { mouseDown(ev) };
    canvas.onmousemove = function(ev) { mouseMove(ev) };
    canvas.onmouseup = function(ev) { mouseUp(ev) };
    document.onkeydown = function(ev) { keydown(ev) };
    var tick = function() {
        rotateAngle += 0.25;
        if (povMode == 0) {
            drawA();
        } else {
            drawB();
        }
        requestAnimationFrame(tick);
    }
    tick();
}

function drawA() {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //////////////cubemap start////////////////////

    gl.viewport(0, 0, canvas.width, canvas.height);
    let rotateMatrix = new Matrix4();
    rotateMatrix.setRotate(angleY, 1, 0, 0); //for mouse rotation
    rotateMatrix.rotate(angleX, 0, 1, 0); //for mouse rotation
    var viewDir = new Vector3([cameraDirX, cameraDirY, cameraDirZ]);
    newViewDir = rotateMatrix.multiplyVector3(viewDir);
    var vpFromCamera = new Matrix4();
    vpFromCamera.setPerspective(90, 1, 1, 100);
    var viewMatrixRotationOnly = new Matrix4();
    viewMatrixRotationOnly.lookAt(cameraX, cameraY, cameraZ,
        cameraX + newViewDir.elements[0],
        cameraY + newViewDir.elements[1],
        cameraZ + newViewDir.elements[2],
        0, 1, 0);
    viewMatrixRotationOnly.elements[12] = 0; //ignore translation
    viewMatrixRotationOnly.elements[13] = 0;
    viewMatrixRotationOnly.elements[14] = 0;
    vpFromCamera.multiply(viewMatrixRotationOnly);
    var vpFromCameraInverse = vpFromCamera.invert();
    gl.useProgram(programEnvCube);
    gl.depthFunc(gl.LEQUAL);
    gl.uniformMatrix4fv(programEnvCube.u_viewDirectionProjectionInverse, false, vpFromCameraInverse.elements);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTex);
    gl.uniform1i(programEnvCube.u_envCubeMap, 0);
    initAttributeVariable(gl, programEnvCube.a_Position, quadObj.vertexBuffer);
    gl.drawArrays(gl.TRIANGLES, 0, quadObj.numVertices);

    //////////////cubemap end////////////////////
    /*
        let vpMatrix = new Matrix4();
        vpMatrix.setPerspective(70, 1, 1, 100);
        vpMatrix.lookAt(cameraX, cameraY, cameraZ,
            cameraX + newViewDir.elements[0],
            cameraY + newViewDir.elements[1],
            cameraZ + newViewDir.elements[2],
            0, 1, 0);
        //add/////////
        var vpFromCamera = new Matrix4();
        vpFromCamera.setPerspective(60, 1, 1, 15);
        var viewMatrixRotationOnly = new Matrix4();
        viewMatrixRotationOnly.lookAt(cameraX, cameraY, cameraZ,
            cameraX + newViewDir.elements[0],
            cameraY + newViewDir.elements[1],
            cameraZ + newViewDir.elements[2],
            0, 1, 0);
        viewMatrixRotationOnly.elements[12] = 0; //ignore translation
        viewMatrixRotationOnly.elements[13] = 0;
        viewMatrixRotationOnly.elements[14] = 0;
        vpFromCamera.multiply(viewMatrixRotationOnly);
        
        let rotateMatrix = new Matrix4();
        rotateMatrix.setRotate(angleY, 1, 0, 0); //for mouse rotation
        rotateMatrix.rotate(angleX, 0, 1, 0); //for mouse rotation
        var viewDir = new Vector3([cameraDirX, cameraDirY, cameraDirZ]);
        newViewDir = rotateMatrix.multiplyVector3(viewDir);
       */
    let vpMatrix = new Matrix4();
    vpMatrix.setPerspective(60, 1, 1, 100);
    vpMatrix.lookAt(cameraX, cameraY, cameraZ,
        cameraX + newViewDir.elements[0],
        cameraY + newViewDir.elements[1],
        cameraZ + newViewDir.elements[2],
        0, 1, 0);
    //add/////////
    var vpFromCamera = new Matrix4();
    vpFromCamera.setPerspective(60, 1, 1, 15);
    var viewMatrixRotationOnly = new Matrix4();
    viewMatrixRotationOnly.lookAt(cameraX, cameraY, cameraZ,
        cameraX + newViewDir.elements[0],
        cameraY + newViewDir.elements[1],
        cameraZ + newViewDir.elements[2],
        0, 1, 0);
    viewMatrixRotationOnly.elements[12] = 0; //ignore translation
    viewMatrixRotationOnly.elements[13] = 0;
    viewMatrixRotationOnly.elements[14] = 0;
    vpFromCamera.multiply(viewMatrixRotationOnly);


    ////////add end
    drawEnvMap(vpFromCamera);
    renderCubeMap(rx, ry, rz);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(defaultProgram);

    drawRegularObjects(vpMatrix);
    let RmdlMatrix = new Matrix4();
    RmdlMatrix.setIdentity();
    RmdlMatrix.translate(-1.5, 1.0, -1.3);
    RmdlMatrix.scale(0.27, 0.27, 0.27);
    drawObjectWithDynamicReflection(sphereObj, RmdlMatrix, vpMatrix, 0.5, 0.3, 0.0);


    ///////////////reflective & refractive//////////////////////
    let cubeMdlMatrixB = new Matrix4();
    cubeMdlMatrixB.setIdentity();
    cubeMdlMatrixB.translate(-1.5, -0.8, -2.0);
    cubeMdlMatrixB.scale(100.0, 0.5, 100.0);
    drawReflectiveCubemap(cubeObj, cubeMdlMatrixB);

    let cubeMdlMatrixA = new Matrix4();
    cubeMdlMatrixA.setIdentity();
    cubeMdlMatrixA.translate(0.0, 3.5, -2.0);
    cubeMdlMatrixA.rotate(rotateAngle, 0, 1, 0.2);
    cubeMdlMatrixA.translate(0.0, 1.0, 0.0);
    cubeMdlMatrixA.scale(0.5, 0.5, 0.5);
    drawRefractiveCubemap(whale, cubeMdlMatrixA);

    let cubeMdlMatrixD = new Matrix4();
    cubeMdlMatrixD.setIdentity();
    cubeMdlMatrixD.translate(0.0, 2.5, 0.0);
    cubeMdlMatrixD.rotate(90, 0, 1, 0);
    cubeMdlMatrixD.rotate(-rotateAngle, 0, 1, 1);
    cubeMdlMatrixD.translate(1.4, 0.0, 0.0);
    cubeMdlMatrixD.scale(0.0005, 0.0005, 0.0005);
    drawRefractiveCubemap(fishA, cubeMdlMatrixD);


    let cubeMdlMatrixC = new Matrix4();
    cubeMdlMatrixC.setIdentity();
    cubeMdlMatrixC.translate(-1.0, 1.5, 0.0);
    cubeMdlMatrixC.rotate(-90, 0, 1, 0);
    cubeMdlMatrixC.rotate(-rotateAngle * 2, 0, 1, 0.2);
    cubeMdlMatrixC.translate(2.5, 0.0, 0.0);
    cubeMdlMatrixC.scale(0.002, 0.002, 0.002);
    drawRefractiveCubemap(fishB, cubeMdlMatrixC);


    let cubeMdlMatrixE = new Matrix4();
    cubeMdlMatrixE.setIdentity();
    cubeMdlMatrixE.translate(-1.0, 1.5, 0.0);
    cubeMdlMatrixE.rotate(-90, 1, 0, 0.2);
    cubeMdlMatrixE.rotate(-rotateAngle * 2, 0, 1, 0.2);
    cubeMdlMatrixE.translate(4.0, 0.0, 0.0);
    cubeMdlMatrixE.scale(0.002, 0.002, 0.002);
    drawRefractiveCubemap(fishB, cubeMdlMatrixE);

    let cubeMdlMatrixF = new Matrix4();
    cubeMdlMatrixF.setIdentity();
    cubeMdlMatrixF.translate(-1.0, 1.5, 3.0);
    cubeMdlMatrixF.rotate(-90, 1, 0, 0.8);
    cubeMdlMatrixF.rotate(-rotateAngle * 1.5, 0, 1, 0.2);
    cubeMdlMatrixF.translate(4.0, 0.0, 0.0);
    cubeMdlMatrixF.scale(0.004, 0.004, 0.004);
    drawRefractiveCubemap(fishA, cubeMdlMatrixF);

    ///// off screen shadow
    gl.useProgram(shadowProgram);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); //set the created frame buffer (fbo) as the destination of this off-screen rendering (for depth info.)
    gl.viewport(0, 0, offScreenWidth, offScreenHeight);

    //clear出現在fbo裡奇怪的skybox
    gl.clearColor(0.0, 0.0, 0.0, 1);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let groundMdlMatrix = new Matrix4();
    groundMdlMatrix.setIdentity();
    groundMdlMatrix.translate(0.0, -1.5, -0.5);
    groundMdlMatrix.scale(3.0, 1.5, 3.0);
    let groundMpvFromLight = drawOffScreen(cubeObj, groundMdlMatrix);

    let foxMdlMatrix = new Matrix4();
    foxMdlMatrix.setTranslate(-0.9, 0.0, 0.5);
    foxMdlMatrix.rotate(45, 0, 1, 0);
    foxMdlMatrix.scale(0.01, 0.01, 0.01);
    let foxMvpFromLight = drawOffScreen(fox, foxMdlMatrix);

    let guitarMdlMatrix = new Matrix4();
    guitarMdlMatrix.setTranslate(0.9, 0.0, 0.);
    guitarMdlMatrix.rotate(45, 0, 1, 0.9);
    guitarMdlMatrix.scale(1.2, 1.2, 1.2);
    let guitarMvpFromLight = drawOffScreen(guitar, guitarMdlMatrix);

    let playerMdlMatrix = new Matrix4();
    playerMdlMatrix.setTranslate(playerX, playerY, playerZ);
    playerMdlMatrix.rotate(180 + angleX, 0, 1, 0);
    playerMdlMatrix.scale(0.01, 0.01, 0.01);
    let playerMvpFromLight = drawOffScreen(fox, playerMdlMatrix);

    let monitorMdlMatrix = new Matrix4();
    monitorMdlMatrix.setIdentity();
    monitorMdlMatrix.translate(1.05, 0.23, -0.505);
    monitorMdlMatrix.rotate(32, 0.0, 1.0, 0.0);
    monitorMdlMatrix.scale(0.18, 0.15, 0.23);
    let monitorMvpFromLight = create_MvpFromLight(monitor, monitorMdlMatrix);

    let benchMdlMatrix = new Matrix4();
    benchMdlMatrix.setTranslate(0.0, 0.0, 0.0);
    benchMdlMatrix.scale(0.005, 0.005, 0.005);
    let benchMvpFromLight = drawOffScreen(bench, benchMdlMatrix);

    let tvMdlMatrix = new Matrix4();
    tvMdlMatrix.setTranslate(1.1, 0.0, -0.5);
    tvMdlMatrix.rotate(30, 0.0, 1, 0.0);
    tvMdlMatrix.scale(0.2, 0.2, 0.2);
    let tvMvpFromLight = drawOffScreen(tv, tvMdlMatrix);

    gl.useProgram(monitorProgram);
    gl.bindFramebuffer(gl.FRAMEBUFFER, monitorFbo);

    gl.clearColor(0.0, 0.0, 0.0, 1);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.viewport(0, 0, offScreenWidth, offScreenHeight);
    // offScreenMonitor(bench, benchMdlMatrix, benchCompImgIndex);
    //offScreenMonitor(cubeObj, groundMdlMatrix, ["tex01"], textures["normalMapImage"]);
    // offScreenMonitor(cube, lightMdlMatrix, null, null);
    // offScreenMonitor(fox, playerMdlMatrix, foxCompImgIndex, null);
    let foxMdlMatrix2 = new Matrix4();
    foxMdlMatrix2.setTranslate(0.0, -2.0, 0.0);
    foxMdlMatrix2.rotate(rotateAngle, 0, 1, 0);
    foxMdlMatrix2.scale(0.055, 0.055, 0.055);
    offScreenMonitor(fox, foxMdlMatrix2, foxCompImgIndex, null);


    gl.useProgram(program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);

    onScreenMonitor(monitor, monitorMdlMatrix, monitorMvpFromLight, 1.0, 1.0, 1.0, monitorFbo);
    drawOneObjectOnScreen(cubeObj, groundMdlMatrix, 1.0, 1.0, 1.0, textures["normalMapImage"], textures["tex01"], groundMpvFromLight, true);
    //drawOneObjectOnScreen(fox, foxMdlMatrix, 1.0, 1.0, 1.0, null, textures[foxCompImgIndex[0]], foxMvpFromLight, true);
    drawOneObjectOnScreen(fox, playerMdlMatrix, 1.0, 1.0, 1.0, null, textures[foxCompImgIndex[0]], playerMvpFromLight, true);
    drawOneObjectOnScreen(bench, benchMdlMatrix, 1.0, 1.0, 1.0, null, textures[benchCompImgIndex[0]], benchMvpFromLight, true);
    drawOneObjectOnScreen(tv, tvMdlMatrix, 0.15, 0.1, 0.1, null, null, tvMvpFromLight, true);
    drawOneObjectOnScreen(guitar, guitarMdlMatrix, 0.15, 0.1, 0.1, null, textures[guitarCompImgIndex[0]], guitarMvpFromLight, true);


    ////////////////


    gl.useProgram(program);
    gl.viewport(canvas.width / 5 * 3.8, canvas.height / 5 * 3.8, canvas.width / 5, canvas.height / 5);
    gl.scissor(canvas.width / 5 * 3.8, canvas.height / 5 * 3.8, canvas.width / 5, canvas.height / 5);
    gl.enable(gl.SCISSOR_TEST);
    gl.clearColor(0.0, 0.0, 0.0, 0.6);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.SCISSOR_TEST);
    //thirdPerson(fox, foxMdlMatrix, 1.0, 1.0, 1.0, null, textures[foxCompImgIndex[0]], foxMvpFromLight, true);
    thirdPerson(cubeObj, groundMdlMatrix, 1.0, 1.0, 1.0, textures["normalMapImage"], textures["tex01"], groundMpvFromLight, true);
    thirdPerson(fox, playerMdlMatrix, 1.0, 1.0, 1.0, null, textures[foxCompImgIndex[0]], playerMvpFromLight, true);
    thirdPerson(bench, benchMdlMatrix, 1.0, 1.0, 1.0, null, textures[benchCompImgIndex[0]], benchMvpFromLight, true);
    drawReflectiveCubemapB(cubeObj, cubeMdlMatrixB);
    thirdPerson(tv, tvMdlMatrix, 0.15, 0.1, 0.1, null, null, tvMvpFromLight, true)



}

function drawB() {

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //////////////cubemap start////////////////////
    gl.viewport(0, 0, canvas.width, canvas.height);
    let rotateMatrix = new Matrix4();
    rotateMatrix.setRotate(angleY, 1, 0, 0); //for mouse rotation
    rotateMatrix.rotate(angleX, 0, 1, 0); //for mouse rotation
    var viewDir = new Vector3([cameraDirX, cameraDirY, cameraDirZ]);
    newViewDir = rotateMatrix.multiplyVector3(viewDir);

    var vpFromCamera = new Matrix4();
    vpFromCamera.setPerspective(60, 1, 1, 100);
    var viewMatrixRotationOnly = new Matrix4();
    viewMatrixRotationOnly.lookAt(cameraX, cameraY, cameraZ,
        cameraX + newViewDir.elements[0],
        cameraY + newViewDir.elements[1],
        cameraZ + newViewDir.elements[2],
        0, 1, 0);
    viewMatrixRotationOnly.elements[12] = 0; //ignore translation
    viewMatrixRotationOnly.elements[13] = 0;
    viewMatrixRotationOnly.elements[14] = 0;
    vpFromCamera.multiply(viewMatrixRotationOnly);
    var vpFromCameraInverse = vpFromCamera.invert();
    gl.useProgram(programEnvCube);
    gl.depthFunc(gl.LEQUAL);
    gl.uniformMatrix4fv(programEnvCube.u_viewDirectionProjectionInverse, false, vpFromCameraInverse.elements);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTex);
    gl.uniform1i(programEnvCube.u_envCubeMap, 0);
    initAttributeVariable(gl, programEnvCube.a_Position, quadObj.vertexBuffer);
    gl.drawArrays(gl.TRIANGLES, 0, quadObj.numVertices);
    //////////////cubemap end////////////////////


    let vpMatrix = new Matrix4();
    vpMatrix.setPerspective(60, 1, 1, 100);
    vpMatrix.lookAt(cameraX2, cameraY2, cameraZ2,
        0, 0, 0,
        0, 1, 0);
    renderCubeMap(rx, ry, rz);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(defaultProgram);
    let RmdlMatrix = new Matrix4();
    RmdlMatrix.setIdentity();
    RmdlMatrix.translate(-1.5, 1.0, -1.3);
    RmdlMatrix.scale(0.27, 0.27, 0.27);
    drawObjectWithDynamicReflectionB(sphereObj, RmdlMatrix, vpMatrix, 0.5, 0.3, 0.0);


    ///////////////reflective//////////////////////
    let cubeMdlMatrixB = new Matrix4();
    cubeMdlMatrixB.setIdentity();
    cubeMdlMatrixB.translate(-1.5, -0.9, -2.0);
    //cubeMdlMatrixB.rotate(rotateAngle, 1, 0, 1);
    cubeMdlMatrixB.scale(100.0, 0.5, 100.0);
    drawReflectiveCubemapB(cubeObj, cubeMdlMatrixB);
    ///////////////refractive///////////////////////
    let cubeMdlMatrixA = new Matrix4();
    cubeMdlMatrixA.setIdentity();
    cubeMdlMatrixA.translate(0.0, 3.5, -2.0);
    cubeMdlMatrixA.rotate(rotateAngle, 0, 1, 0.2);
    cubeMdlMatrixA.translate(0.0, 1.0, 0.0);
    cubeMdlMatrixA.scale(0.5, 0.5, 0.5);
    drawRefractiveCubemapB(whale, cubeMdlMatrixA);


    let cubeMdlMatrixD = new Matrix4();
    cubeMdlMatrixD.setIdentity();
    cubeMdlMatrixD.translate(0.0, 2.5, 0.0);
    cubeMdlMatrixD.rotate(90, 0, 1, 0);
    cubeMdlMatrixD.rotate(-rotateAngle, 0, 1, 1);
    cubeMdlMatrixD.translate(1.4, 0.0, 0.0);
    cubeMdlMatrixD.scale(0.0005, 0.0005, 0.0005);
    drawRefractiveCubemapB(fishA, cubeMdlMatrixD);


    let cubeMdlMatrixC = new Matrix4();
    cubeMdlMatrixC.setIdentity();
    cubeMdlMatrixC.translate(-1.0, 1.5, 0.0);
    cubeMdlMatrixC.rotate(-90, 0, 1, 0);
    cubeMdlMatrixC.rotate(-rotateAngle * 2, 0, 1, 0.2);
    cubeMdlMatrixC.translate(2.5, 0.0, 0.0);
    cubeMdlMatrixC.scale(0.002, 0.002, 0.002);
    drawRefractiveCubemapB(fishB, cubeMdlMatrixC);


    let cubeMdlMatrixE = new Matrix4();
    cubeMdlMatrixE.setIdentity();
    cubeMdlMatrixE.translate(-1.0, 1.5, 0.0);
    cubeMdlMatrixE.rotate(-90, 1, 0, 0.2);
    cubeMdlMatrixE.rotate(-rotateAngle * 2, 0, 1, 0.2);
    cubeMdlMatrixE.translate(4.0, 0.0, 0.0);
    cubeMdlMatrixE.scale(0.002, 0.002, 0.002);
    drawRefractiveCubemapB(fishB, cubeMdlMatrixE);

    let cubeMdlMatrixF = new Matrix4();
    cubeMdlMatrixF.setIdentity();
    cubeMdlMatrixF.translate(-1.0, 1.5, 3.0);
    cubeMdlMatrixF.rotate(-90, 1, 0, 0.8);
    cubeMdlMatrixF.rotate(-rotateAngle * 1.5, 0, 1, 0.2);
    cubeMdlMatrixF.translate(4.0, 0.0, 0.0);
    cubeMdlMatrixF.scale(0.004, 0.004, 0.004);
    drawRefractiveCubemapB(fishA, cubeMdlMatrixF);

    ///// off screen shadow
    gl.useProgram(shadowProgram);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); //set the created frame buffer (fbo) as the destination of this off-screen rendering (for depth info.)
    gl.viewport(0, 0, offScreenWidth, offScreenHeight);

    //clear出現在fbo裡奇怪的skybox
    gl.clearColor(0.0, 0.0, 0.0, 1);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let groundMdlMatrix = new Matrix4();
    groundMdlMatrix.setIdentity();
    groundMdlMatrix.translate(0.0, -1.5, -0.5);
    groundMdlMatrix.scale(3.0, 1.5, 3.0);
    let groundMpvFromLight = drawOffScreen(cubeObj, groundMdlMatrix);

    let guitarMdlMatrix = new Matrix4();
    guitarMdlMatrix.setTranslate(0.9, 0.0, 0.);
    guitarMdlMatrix.rotate(45, 0, 1, 0.9);
    guitarMdlMatrix.scale(1.2, 1.2, 1.2);
    let guitarMvpFromLight = drawOffScreen(guitar, guitarMdlMatrix);

    let foxMdlMatrix = new Matrix4();
    foxMdlMatrix.setTranslate(-1.0, 0.0, 0.0);
    foxMdlMatrix.rotate(45, 0, 1, 0);
    foxMdlMatrix.scale(0.01, 0.01, 0.01);
    let foxMvpFromLight = drawOffScreen(fox, foxMdlMatrix);

    let playerMdlMatrix = new Matrix4();
    playerMdlMatrix.setTranslate(playerX, playerY, playerZ);
    playerMdlMatrix.rotate(180 + angleX, 0, 1, 0);
    playerMdlMatrix.scale(0.01, 0.01, 0.01);
    let playerMvpFromLight = drawOffScreen(fox, playerMdlMatrix);

    let monitorMdlMatrix = new Matrix4();
    monitorMdlMatrix.setIdentity();
    monitorMdlMatrix.translate(1.05, 0.23, -0.505);
    monitorMdlMatrix.rotate(32, 0.0, 1.0, 0.0);
    monitorMdlMatrix.scale(0.18, 0.15, 0.23);
    let monitorMvpFromLight = create_MvpFromLight(monitor, monitorMdlMatrix);

    let benchMdlMatrix = new Matrix4();
    benchMdlMatrix.setTranslate(0.0, 0.0, 0.0);
    benchMdlMatrix.scale(0.005, 0.005, 0.005);
    let benchMvpFromLight = drawOffScreen(bench, benchMdlMatrix);


    let lightMdlMatrix = new Matrix4();
    lightMdlMatrix.setIdentity();
    lightMdlMatrix.translate(lightX, lightY, lightZ);
    lightMdlMatrix.scale(0.15, 0.15, 0.15);
    let lightMvpFromLight = create_MvpFromLight(sphere, lightMdlMatrix);

    let tvMdlMatrix = new Matrix4();
    tvMdlMatrix.setTranslate(1.1, 0.0, -0.5);
    tvMdlMatrix.rotate(30, 0.0, 1, 0.0);
    tvMdlMatrix.scale(0.2, 0.2, 0.2);
    let tvMvpFromLight = drawOffScreen(tv, tvMdlMatrix);

    gl.useProgram(monitorProgram);
    gl.bindFramebuffer(gl.FRAMEBUFFER, monitorFbo);

    gl.clearColor(0.0, 0.0, 0.0, 1);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.viewport(0, 0, offScreenWidth, offScreenHeight);
    offScreenMonitor(bench, benchMdlMatrix, benchCompImgIndex);
    offScreenMonitor(cubeObj, groundMdlMatrix, ["tex01"], textures["normalMapImage"]);
    offScreenMonitor(cube, lightMdlMatrix, null, null);
    offScreenMonitor(fox, foxMdlMatrix, foxCompImgIndex, null);
    offScreenMonitor(fox, playerMdlMatrix, foxCompImgIndex, null);


    ///// on screen rendering
    gl.useProgram(program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.scissor(0, 0, canvas.width, canvas.height);
    thirdPerson(fox, foxMdlMatrix, 1.0, 1.0, 1.0, null, textures[foxCompImgIndex[0]], foxMvpFromLight, true);
    thirdPerson(cubeObj, groundMdlMatrix, 1.0, 1.0, 1.0, textures["normalMapImage"], textures["tex01"], groundMpvFromLight, true);
    thirdPerson(fox, playerMdlMatrix, 1.0, 1.0, 1.0, null, textures[foxCompImgIndex[0]], playerMvpFromLight, true);
    thirdPerson(bench, benchMdlMatrix, 1.0, 1.0, 1.0, null, textures[benchCompImgIndex[0]], benchMvpFromLight, true);
    thirdPerson(guitar, guitarMdlMatrix, 0.15, 0.1, 0.1, null, textures[guitarCompImgIndex[0]], guitarMvpFromLight, true);
    thirdPerson(tv, tvMdlMatrix, 0.15, 0.1, 0.1, null, null, tvMvpFromLight, true);
    thirdPerson(cubeObj, monitorMdlMatrix, 1.0, 1.0, 1.0, null, monitorFbo.texture, monitorMvpFromLight, true);

    gl.viewport(canvas.width / 5 * 3.8, canvas.height / 5 * 3.8, canvas.width / 5, canvas.height / 5);
    gl.scissor(canvas.width / 5 * 3.8, canvas.height / 5 * 3.8, canvas.width / 5, canvas.height / 5);
    gl.enable(gl.SCISSOR_TEST);
    gl.clearColor(0.0, 0.0, 0.0, 0.6);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.SCISSOR_TEST);

    gl.useProgram(programEnvCube);
    gl.depthFunc(gl.LEQUAL);
    gl.uniformMatrix4fv(programEnvCube.u_viewDirectionProjectionInverse, false, vpFromCameraInverse.elements);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTex);
    gl.uniform1i(programEnvCube.u_envCubeMap, 0);
    initAttributeVariable(gl, programEnvCube.a_Position, quadObj.vertexBuffer);
    gl.drawArrays(gl.TRIANGLES, 0, quadObj.numVertices);

    //onScreenMonitor(monitor, monitorMdlMatrix, monitorMvpFromLight, 1.0, 1.0, 1.0, monitorFbo);
    //onScreenMonitor(monitor, monitorMdlMatrix, monitorMvpFromLight, 1.0, 1.0, 1.0, monitorFbo);
    drawOneObjectOnScreen(cubeObj, groundMdlMatrix, 1.0, 1.0, 1.0, textures["normalMapImage"], textures["tex01"], groundMpvFromLight, true);
    drawOneObjectOnScreen(fox, foxMdlMatrix, 1.0, 1.0, 1.0, null, textures[foxCompImgIndex[0]], foxMvpFromLight, true);
    drawOneObjectOnScreen(fox, playerMdlMatrix, 1.0, 1.0, 1.0, null, textures[foxCompImgIndex[0]], playerMvpFromLight, true);
    drawOneObjectOnScreen(bench, benchMdlMatrix, 1.0, 1.0, 1.0, null, textures[benchCompImgIndex[0]], benchMvpFromLight, true);
    drawOneObjectOnScreen(tv, tvMdlMatrix, 0.15, 0.1, 0.1, null, null, tvMvpFromLight, true);
    drawReflectiveCubemap(cubeObj, cubeMdlMatrixB);

}


function drawOffScreen(obj, mdlMatrix) {
    var mvpFromLight = new Matrix4();
    //model Matrix (part of the mvp matrix)
    let modelMatrix = new Matrix4();
    modelMatrix.setRotate(angleY, 1, 0, 0);
    modelMatrix.rotate(angleX, 0, 1, 0);
    modelMatrix.multiply(mdlMatrix);
    //mvp: projection * view * model matrix  
    mvpFromLight.setPerspective(70, offScreenWidth / offScreenHeight, 1, 100);
    mvpFromLight.lookAt(lightX, lightY, lightZ, 0, 0, 0, 0, 1, 0);
    //mvpFromLight.multiply(modelMatrix);
    //改成光源固定->.multiply(mdlMatrix);
    mvpFromLight.multiply(mdlMatrix);

    gl.uniformMatrix4fv(shadowProgram.u_MvpMatrix, false, mvpFromLight.elements);

    for (let i = 0; i < obj.length; i++) {
        initAttributeVariable(gl, shadowProgram.a_Position, obj[i].vertexBuffer);
        gl.drawArrays(gl.TRIANGLES, 0, obj[i].numVertices);
    }
    return mvpFromLight;
}


function create_MvpFromLight(obj, mdlMatrix) {
    var mvpFromLight = new Matrix4();
    let modelMatrix = new Matrix4();
    modelMatrix.setRotate(angleY, 1, 0, 0);
    modelMatrix.rotate(angleX, 0, 1, 0);
    modelMatrix.multiply(mdlMatrix);
    mvpFromLight.setPerspective(70, offScreenWidth / offScreenHeight, 1, 100);
    mvpFromLight.lookAt(lightX, lightY, lightZ, 0, 0, 0, 0, 1, 0);
    mvpFromLight.multiply(mdlMatrix);
    return mvpFromLight;
}

function offScreenMonitor(obj, mdlMatrix, objCompImgIndex, bumpImg) {
    //////////////monitor裡的cubemap再畫一次////////////////////
    /*
    var vpFromCamera = new Matrix4();
    vpFromCamera.setPerspective(60, 1, 1, 100);
    var viewMatrixRotationOnly = new Matrix4();
    viewMatrixRotationOnly.lookAt(cameraX2, cameraY2, cameraZ2,
        0, 0, 0,
        0, 1, 0);
    viewMatrixRotationOnly.elements[12] = 0; //ignore translation
    viewMatrixRotationOnly.elements[13] = 0;
    viewMatrixRotationOnly.elements[14] = 0;
    vpFromCamera.multiply(viewMatrixRotationOnly);
    var vpFromCameraInverse = vpFromCamera.invert();
    gl.useProgram(programEnvCube);
    gl.depthFunc(gl.LEQUAL);
    gl.uniformMatrix4fv(programEnvCube.u_viewDirectionProjectionInverse, false, vpFromCameraInverse.elements);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTex);
    gl.uniform1i(programEnvCube.u_envCubeMap, 0);
    initAttributeVariable(gl, programEnvCube.a_Position, quadObj.vertexBuffer);
    gl.drawArrays(gl.TRIANGLES, 0, quadObj.numVertices);
    */
    //////////////cubemap end////////////////////
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(monitorProgram);
    var mvpFromCamera = new Matrix4();
    let modelMatrix = new Matrix4();
    modelMatrix.setIdentity();
    modelMatrix.multiply(mdlMatrix);
    mvpFromCamera.setPerspective(60, 1, 1, 100);
    mvpFromCamera.lookAt(cameraX2, cameraY2, cameraZ2,
        0, 0, 0, 0, 1, 0);
    mvpFromCamera.multiply(modelMatrix);

    //addshadow//////////
    var mvpFromLight = new Matrix4();
    mvpFromLight.setPerspective(70, offScreenWidth / offScreenHeight, 1, 100);
    mvpFromLight.lookAt(lightX, lightY, lightZ, 0, 0, 0, 0, 1, 0);
    mvpFromLight.multiply(mdlMatrix);
    gl.uniform1f(monitorProgram.u_ShadowBool, 1.0);
    gl.uniformMatrix4fv(monitorProgram.u_MvpMatrixOfLight, false, mvpFromLight.elements);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, fbo.texture);
    gl.uniform1i(monitorProgram.u_ShadowMap, 0);

    let normalMatrix = new Matrix4();
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();

    gl.uniform3f(monitorProgram.u_LightPosition, lightX, lightY, lightZ);
    gl.uniform3f(monitorProgram.u_ViewPosition, cameraX, cameraY, cameraZ);
    gl.uniform1f(monitorProgram.u_Ka, 0.2);
    gl.uniform1f(monitorProgram.u_Kd, 0.7);
    gl.uniform1f(monitorProgram.u_Ks, 1.0);
    gl.uniform1f(monitorProgram.u_shininess, 10.0);
    gl.uniform3f(monitorProgram.u_Color, 1.0, 1.0, 1.0);

    gl.uniformMatrix4fv(monitorProgram.u_MvpMatrix, false, mvpFromCamera.elements);
    gl.uniformMatrix4fv(monitorProgram.u_modelMatrix, false, modelMatrix.elements);
    gl.uniformMatrix4fv(monitorProgram.u_normalMatrix, false, normalMatrix.elements);

    if (bumpImg) {
        gl.uniform1f(monitorProgram.u_BumpBool, 1.0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, bumpImg);
        gl.uniform1i(monitorProgram.u_bumpMap, 1);
    } else {
        gl.uniform1f(monitorProgram.u_BumpBool, 0.0);
    }

    for (let i = 0; i < obj.length; i++) {
        if (objCompImgIndex) {
            gl.uniform1f(monitorProgram.u_TexBool, 1.0);
            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_2D, textures[objCompImgIndex[i]]);
            gl.uniform1i(monitorProgram.u_Sampler1, 2);
            initAttributeVariable(gl, monitorProgram.a_TexCoord, obj[i].texCoordBuffer);
        } else {
            gl.uniform1f(monitorProgram.u_TexBool, 0.0);
        }
        initAttributeVariable(gl, monitorProgram.a_Position, obj[i].vertexBuffer);
        initAttributeVariable(gl, monitorProgram.a_Normal, obj[i].normalBuffer);
        gl.drawArrays(gl.TRIANGLES, 0, obj[i].numVertices);
    }

}

function onScreenMonitor(obj, mdlMatrix, mvpFromLight, colorR, colorG, colorB, mFbo) {
    var mvpFromCamera = new Matrix4();
    //model Matrix (part of the mvp matrix)
    let modelMatrix = new Matrix4();
    modelMatrix.setIdentity();
    modelMatrix.multiply(mdlMatrix);
    //mvp: projection * view * model matrix  
    mvpFromCamera.setPerspective(60, 1, 1, 100);
    //mvpFromCamera.lookAt(cameraX, cameraY, cameraZ, 0, 0, 0, 0, 1, 0);
    //改成w,s按鍵以view direction前進
    mvpFromCamera.lookAt(cameraX, cameraY, cameraZ,
        cameraX + newViewDir.elements[0],
        cameraY + newViewDir.elements[1],
        cameraZ + newViewDir.elements[2],
        0, 1, 0);
    mvpFromCamera.multiply(modelMatrix);

    //normal matrix
    let normalMatrix = new Matrix4();
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();

    gl.uniform3f(program.u_LightPosition, lightX, lightY, lightZ);
    gl.uniform3f(program.u_ViewPosition, cameraX, cameraY, cameraZ);
    gl.uniform1f(program.u_Ka, 0.2);
    gl.uniform1f(program.u_Kd, 0.7);
    gl.uniform1f(program.u_Ks, 1.0);
    gl.uniform1f(program.u_shininess, 10.0);
    gl.uniform3f(program.u_Color, colorR, colorG, colorB);

    gl.uniformMatrix4fv(program.u_MvpMatrix, false, mvpFromCamera.elements);
    gl.uniformMatrix4fv(program.u_modelMatrix, false, modelMatrix.elements);
    gl.uniformMatrix4fv(program.u_normalMatrix, false, normalMatrix.elements);
    gl.uniformMatrix4fv(program.u_MvpMatrixOfLight, false, mvpFromLight.elements);
    //shadow



    for (let i = 0; i < obj.length; i++) {
        if (mFbo.texture) {
            gl.uniform1f(program.u_TexBool, 1.0);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, mFbo.texture);
            gl.uniform1i(program.u_Sampler1, 1);
            initAttributeVariable(gl, program.a_TexCoord, obj[i].texCoordBuffer);
        } else {
            gl.uniform1f(program.u_TexBool, 0.0);
        }
        initAttributeVariable(gl, program.a_Position, obj[i].vertexBuffer);
        initAttributeVariable(gl, program.a_Normal, obj[i].normalBuffer);
        gl.drawArrays(gl.TRIANGLES, 0, obj[i].numVertices);
    }
}

function callSphere() {
    longitude = 50; //bands
    latitude = 50; //bands
    sphereVertices = [];
    sphereVerticesProccessed = [];
    var vertexPositionData = [];
    radius = 1.0
    angle = 2 * Math.PI / 6; //60 degree

    for (i = 0; i <= latitude; i++) {
        var theta = i * Math.PI / latitude;
        for (var j = 0; j <= longitude; j++) {
            //計算φ角度（經度）
            var phi = j * 2 * Math.PI / longitude;
            //計算頂點xyz
            var x = radius * Math.sin(theta) * Math.cos(phi);
            var y = radius * Math.cos(theta);
            var z = radius * Math.sin(theta) * Math.sin(phi);
            sphereVertices.push(x);
            sphereVertices.push(y);
            sphereVertices.push(z);
        }
    }


    start = longitude;

    for (i = 0; i < latitude; i++) {
        index = i + start;
        sphereVerticesProccessed.push(sphereVertices[start * 3 + 0]);
        sphereVerticesProccessed.push(sphereVertices[start * 3 + 1]);
        sphereVerticesProccessed.push(sphereVertices[start * 3 + 2]);

        sphereVerticesProccessed.push(sphereVertices[(index + 2) * 3 + 0]);
        sphereVerticesProccessed.push(sphereVertices[(index + 2) * 3 + 1]);
        sphereVerticesProccessed.push(sphereVertices[(index + 2) * 3 + 2]);

        sphereVerticesProccessed.push(sphereVertices[(index + 1) * 3 + 0]);
        sphereVerticesProccessed.push(sphereVertices[(index + 1) * 3 + 1]);
        sphereVerticesProccessed.push(sphereVertices[(index + 1) * 3 + 2]);
    }

    start = longitude;
    for (i = 1; i <= (latitude + 1) * (longitude - 2); i++) {
        index = i + start;
        sphereVerticesProccessed.push(sphereVertices[index * 3 + 0]);
        sphereVerticesProccessed.push(sphereVertices[index * 3 + 1]);
        sphereVerticesProccessed.push(sphereVertices[index * 3 + 2]);

        sphereVerticesProccessed.push(sphereVertices[(index + longitude + 1) * 3 + 0]);
        sphereVerticesProccessed.push(sphereVertices[(index + longitude + 1) * 3 + 1]);
        sphereVerticesProccessed.push(sphereVertices[(index + longitude + 1) * 3 + 2]);

        sphereVerticesProccessed.push(sphereVertices[(index + longitude) * 3 + 0]);
        sphereVerticesProccessed.push(sphereVertices[(index + longitude) * 3 + 1]);
        sphereVerticesProccessed.push(sphereVertices[(index + longitude) * 3 + 2]);

    }
    for (i = 1; i <= (latitude + 1) * (longitude - 1); i++) {
        index = i + start;
        sphereVerticesProccessed.push(sphereVertices[index * 3 + 0]);
        sphereVerticesProccessed.push(sphereVertices[index * 3 + 1]);
        sphereVerticesProccessed.push(sphereVertices[index * 3 + 2]);

        sphereVerticesProccessed.push(sphereVertices[(index + 1) * 3 + 0]);
        sphereVerticesProccessed.push(sphereVertices[(index + 1) * 3 + 1]);
        sphereVerticesProccessed.push(sphereVertices[(index + 1) * 3 + 2]);

        sphereVerticesProccessed.push(sphereVertices[(index + longitude + 1) * 3 + 0]);
        sphereVerticesProccessed.push(sphereVertices[(index + longitude + 1) * 3 + 1]);
        sphereVerticesProccessed.push(sphereVertices[(index + longitude + 1) * 3 + 2]);

    }
    sphereNormals = getNormalOnVertices(sphereVerticesProccessed);
    let o = initVertexBufferForLaterUse(gl, sphereVerticesProccessed, sphereNormals, null);
    sphere.push(o);
}

function drawReflectiveCubemap(obj, mdlMatrix) {
    gl.useProgram(environment_reflectProgram);
    gl.depthFunc(gl.LESS);
    var mvpFromCamera = new Matrix4();
    let modelMatrix = new Matrix4();
    modelMatrix.setIdentity();
    modelMatrix.multiply(mdlMatrix);
    mvpFromCamera.setPerspective(60, 1, 1, 100);

    mvpFromCamera.lookAt(cameraX, cameraY, cameraZ,
        cameraX + newViewDir.elements[0],
        cameraY + newViewDir.elements[1],
        cameraZ + newViewDir.elements[2],
        0, 1, 0);
    mvpFromCamera.multiply(mdlMatrix);
    let normalMatrix = new Matrix4();
    normalMatrix.setInverseOf(mdlMatrix);
    normalMatrix.transpose();
    gl.uniform3f(environment_reflectProgram.u_ViewPosition, cameraX, cameraY, cameraZ);
    gl.uniform1i(environment_reflectProgram.u_envCubeMap, 0);
    gl.uniformMatrix4fv(environment_reflectProgram.u_MvpMatrix, false, mvpFromCamera.elements);
    gl.uniformMatrix4fv(environment_reflectProgram.u_modelMatrix, false, modelMatrix.elements);
    gl.uniformMatrix4fv(environment_reflectProgram.u_normalMatrix, false, normalMatrix.elements);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTex);
    for (let i = 0; i < obj.length; i++) {
        initAttributeVariable(gl, environment_reflectProgram.a_Position, obj[i].vertexBuffer);
        initAttributeVariable(gl, environment_reflectProgram.a_Normal, obj[i].normalBuffer);
        gl.drawArrays(gl.TRIANGLES, 0, obj[i].numVertices);
    }
}

function drawReflectiveCubemapB(obj, mdlMatrix) {
    gl.useProgram(environment_reflectProgram);
    gl.depthFunc(gl.LESS);
    var mvpFromCamera = new Matrix4();
    let modelMatrix = new Matrix4();
    modelMatrix.setIdentity();
    modelMatrix.multiply(mdlMatrix);
    mvpFromCamera.setPerspective(60, 1, 1, 100);
    mvpFromCamera.lookAt(cameraX3, cameraY3, cameraZ3,
        0, 0, 0,
        0, 1, 0);
    mvpFromCamera.multiply(modelMatrix);
    let normalMatrix = new Matrix4();
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();

    gl.uniform3f(environment_reflectProgram.u_ViewPosition, cameraX3, cameraY3, cameraZ3);
    gl.uniform1i(environment_reflectProgram.u_envCubeMap, 0);
    gl.uniformMatrix4fv(environment_reflectProgram.u_MvpMatrix, false, mvpFromCamera.elements);
    gl.uniformMatrix4fv(environment_reflectProgram.u_modelMatrix, false, modelMatrix.elements);
    gl.uniformMatrix4fv(environment_reflectProgram.u_normalMatrix, false, normalMatrix.elements);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTex);
    for (let i = 0; i < obj.length; i++) {
        initAttributeVariable(gl, environment_reflectProgram.a_Position, obj[i].vertexBuffer);
        initAttributeVariable(gl, environment_reflectProgram.a_Normal, obj[i].normalBuffer);
        gl.drawArrays(gl.TRIANGLES, 0, obj[i].numVertices);
    }
}

function drawRefractiveCubemap(obj, mdlMatrix) {
    gl.useProgram(environment_refractProgram);
    gl.depthFunc(gl.LESS);

    var mvpFromCamera = new Matrix4();
    let modelMatrix = new Matrix4();
    modelMatrix.setIdentity();
    modelMatrix.multiply(mdlMatrix);
    mvpFromCamera.setPerspective(60, 1, 1, 100);

    mvpFromCamera.lookAt(cameraX, cameraY, cameraZ,
        cameraX + newViewDir.elements[0],
        cameraY + newViewDir.elements[1],
        cameraZ + newViewDir.elements[2],
        0, 1, 0);

    mvpFromCamera.multiply(modelMatrix);

    let normalMatrix = new Matrix4();
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();

    gl.uniform3f(environment_refractProgram.u_ViewPosition, cameraX, cameraY, cameraZ);
    gl.uniform1i(environment_refractProgram.u_envCubeMap, 0);
    gl.uniformMatrix4fv(environment_refractProgram.u_MvpMatrix, false, mvpFromCamera.elements);
    gl.uniformMatrix4fv(environment_refractProgram.u_modelMatrix, false, modelMatrix.elements);
    gl.uniformMatrix4fv(environment_refractProgram.u_normalMatrix, false, normalMatrix.elements);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTex);
    for (let i = 0; i < obj.length; i++) {
        initAttributeVariable(gl, environment_refractProgram.a_Position, obj[i].vertexBuffer);
        initAttributeVariable(gl, environment_refractProgram.a_Normal, obj[i].normalBuffer);
        gl.drawArrays(gl.TRIANGLES, 0, obj[i].numVertices);
    }
}

function drawRefractiveCubemapB(obj, mdlMatrix) {
    gl.useProgram(environment_refractProgram);
    gl.depthFunc(gl.LESS);
    var mvpFromCamera = new Matrix4();
    let modelMatrix = new Matrix4();
    modelMatrix.setIdentity();
    modelMatrix.multiply(mdlMatrix);
    mvpFromCamera.setPerspective(60, 1, 1, 100);
    mvpFromCamera.lookAt(cameraX3, cameraY3, cameraZ3,
        0, 0, 0,
        0, 1, 0);
    mvpFromCamera.multiply(modelMatrix);
    let normalMatrix = new Matrix4();
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();

    gl.uniform3f(environment_refractProgram.u_ViewPosition, cameraX, cameraY, cameraZ);
    gl.uniform1i(environment_refractProgram.u_envCubeMap, 0);
    gl.uniformMatrix4fv(environment_refractProgram.u_MvpMatrix, false, mvpFromCamera.elements);
    gl.uniformMatrix4fv(environment_refractProgram.u_modelMatrix, false, modelMatrix.elements);
    gl.uniformMatrix4fv(environment_refractProgram.u_normalMatrix, false, normalMatrix.elements);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTex);
    for (let i = 0; i < obj.length; i++) {
        initAttributeVariable(gl, environment_refractProgram.a_Position, obj[i].vertexBuffer);
        initAttributeVariable(gl, environment_refractProgram.a_Normal, obj[i].normalBuffer);
        gl.drawArrays(gl.TRIANGLES, 0, obj[i].numVertices);
    }
}

function thirdPerson(obj, mdlMatrix, colorR, colorG, colorB, bumpImg, textureImg, mvpFromLight, shadowTF) {
    //////////////cubemap//////////////
    gl.useProgram(programEnvCube);
    var vpFromCamera = new Matrix4();
    vpFromCamera.setPerspective(60, 1, 1, 100);
    var viewMatrixRotationOnly = new Matrix4();
    viewMatrixRotationOnly.lookAt(cameraX2, cameraY2, cameraZ2,
        //cameraX + newViewDir.elements[0],
        //cameraY + newViewDir.elements[1],
        //cameraZ + newViewDir.elements[2],
        0, 0, 0,
        0, 1, 0);
    viewMatrixRotationOnly.elements[12] = 0; //ignore translation
    viewMatrixRotationOnly.elements[13] = 0;
    viewMatrixRotationOnly.elements[14] = 0;
    vpFromCamera.multiply(viewMatrixRotationOnly);
    var vpFromCameraInverse = vpFromCamera.invert();
    gl.depthFunc(gl.LEQUAL);
    gl.uniformMatrix4fv(programEnvCube.u_viewDirectionProjectionInverse, false, vpFromCameraInverse.elements);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTex);
    gl.uniform1i(programEnvCube.u_envCubeMap, 0);
    initAttributeVariable(gl, programEnvCube.a_Position, quadObj.vertexBuffer);
    gl.drawArrays(gl.TRIANGLES, 0, quadObj.numVertices);
    //////////////cubemap end//////////////

    gl.useProgram(defaultProgram);
    var mvpFromCamera = new Matrix4();
    let modelMatrix = new Matrix4();
    modelMatrix.setIdentity();
    modelMatrix.multiply(mdlMatrix);
    mvpFromCamera.setPerspective(60, 1, 1, 100);
    mvpFromCamera.lookAt(cameraX3, cameraY3, cameraZ3,
        0, 0, 0,
        0, 1, 0);
    mvpFromCamera.multiply(modelMatrix);
    let normalMatrix = new Matrix4();
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();

    gl.uniform3f(defaultProgram.u_LightPosition, lightX, lightY, lightZ);
    gl.uniform3f(defaultProgram.u_ViewPosition, cameraX, cameraY, cameraZ);
    gl.uniform1f(defaultProgram.u_Ka, 0.2);
    gl.uniform1f(defaultProgram.u_Kd, 0.7);
    gl.uniform1f(defaultProgram.u_Ks, 1.0);
    gl.uniform1f(defaultProgram.u_shininess, 40.0);
    gl.uniform3f(defaultProgram.u_Color, colorR, colorG, colorB);


    gl.uniformMatrix4fv(defaultProgram.u_MvpMatrix, false, mvpFromCamera.elements);
    gl.uniformMatrix4fv(defaultProgram.u_modelMatrix, false, modelMatrix.elements);
    gl.uniformMatrix4fv(defaultProgram.u_normalMatrix, false, normalMatrix.elements);

    if (textureImg) {
        gl.uniform1f(defaultProgram.u_TexBool, 1.0);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, textureImg);
        gl.uniform1i(defaultProgram.u_Sampler1, 2);
    } else {
        gl.uniform1f(defaultProgram.u_TexBool, 0.0);
    }
    if (bumpImg) {
        gl.uniform1f(defaultProgram.u_BumpBool, 1.0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, bumpImg);
        gl.uniform1i(defaultProgram.u_bumpMap, 0);
    } else {
        gl.uniform1f(defaultProgram.u_BumpBool, 0.0);
    }
    if (mvpFromLight) {
        if (shadowTF == true) {
            gl.uniform1f(defaultProgram.u_ShadowBool, 1.0);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, fbo.texture);
            gl.uniform1i(defaultProgram.u_ShadowMap, 1);
        } else {
            gl.uniform1f(defaultProgram.u_ShadowBool, 0.0);
        }
        gl.uniformMatrix4fv(defaultProgram.u_MvpMatrixOfLight, false, mvpFromLight.elements);
    } else {
        gl.uniform1f(defaultProgram.u_ShadowBool, 0.0);
    }

    for (let i = 0; i < obj.length; i++) {
        initAttributeVariable(gl, defaultProgram.a_Position, obj[i].vertexBuffer);
        initAttributeVariable(gl, defaultProgram.a_Normal, obj[i].normalBuffer);
        initAttributeVariable(gl, defaultProgram.a_TexCoord, obj[i].texCoordBuffer);
        if (textureImg) {
            initAttributeVariable(gl, defaultProgram.a_TexCoord, obj[i].texCoordBuffer);
        }
        initAttributeVariable(gl, defaultProgram.a_Tagent, obj[i].tagentsBuffer);
        initAttributeVariable(gl, defaultProgram.a_Bitagent, obj[i].bitagentsBuffer);
        initAttributeVariable(gl, defaultProgram.a_crossTexCoord, obj[i].crossTexCoordsBuffer);
        gl.drawArrays(gl.TRIANGLES, 0, obj[i].numVertices);
    }
}

function drawOneObjectOnScreen(obj, mdlMatrix, colorR, colorG, colorB, bumpImg, textureImg, mvpFromLight, shadowTF) {
    gl.useProgram(defaultProgram);
    var mvpFromCamera = new Matrix4();
    let modelMatrix = new Matrix4();
    let mvpMatrix = new Matrix4();
    modelMatrix.setIdentity();
    modelMatrix.multiply(mdlMatrix);
    mvpFromCamera.setPerspective(60, 1, 1, 100);
    mvpFromCamera.lookAt(cameraX, cameraY, cameraZ,
        cameraX + newViewDir.elements[0],
        cameraY + newViewDir.elements[1],
        cameraZ + newViewDir.elements[2],
        0, 1, 0);
    mvpFromCamera.multiply(modelMatrix);
    //normal matrix
    let normalMatrix = new Matrix4();
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();

    gl.uniform3f(defaultProgram.u_LightPosition, lightX, lightY, lightZ);
    gl.uniform3f(defaultProgram.u_ViewPosition, cameraX, cameraY, cameraZ);
    gl.uniform1f(defaultProgram.u_Ka, 0.2);
    gl.uniform1f(defaultProgram.u_Kd, 0.7);
    gl.uniform1f(defaultProgram.u_Ks, 1.0);
    gl.uniform1f(defaultProgram.u_shininess, 40.0);
    gl.uniform3f(defaultProgram.u_Color, colorR, colorG, colorB);


    gl.uniformMatrix4fv(defaultProgram.u_MvpMatrix, false, mvpFromCamera.elements);
    gl.uniformMatrix4fv(defaultProgram.u_modelMatrix, false, modelMatrix.elements);
    gl.uniformMatrix4fv(defaultProgram.u_normalMatrix, false, normalMatrix.elements);

    if (textureImg) {
        gl.uniform1f(defaultProgram.u_TexBool, 1.0);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, textureImg);
        gl.uniform1i(defaultProgram.u_Sampler1, 2);
    } else {
        gl.uniform1f(defaultProgram.u_TexBool, 0.0);
    }
    if (bumpImg) {
        gl.uniform1f(defaultProgram.u_BumpBool, 1.0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, bumpImg);
        gl.uniform1i(defaultProgram.u_bumpMap, 0);
    } else {
        gl.uniform1f(defaultProgram.u_BumpBool, 0.0);
    }
    if (mvpFromLight) {
        if (shadowTF == true) {
            gl.uniform1f(defaultProgram.u_ShadowBool, 1.0);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, fbo.texture);
            gl.uniform1i(defaultProgram.u_ShadowMap, 1);
        } else {
            gl.uniform1f(defaultProgram.u_ShadowBool, 0.0);
        }
        gl.uniformMatrix4fv(defaultProgram.u_MvpMatrixOfLight, false, mvpFromLight.elements);
    } else {
        gl.uniform1f(defaultProgram.u_ShadowBool, 0.0);
    }

    for (let i = 0; i < obj.length; i++) {
        initAttributeVariable(gl, defaultProgram.a_Position, obj[i].vertexBuffer);
        initAttributeVariable(gl, defaultProgram.a_Normal, obj[i].normalBuffer);
        initAttributeVariable(gl, defaultProgram.a_TexCoord, obj[i].texCoordBuffer);
        if (textureImg) {
            initAttributeVariable(gl, defaultProgram.a_TexCoord, obj[i].texCoordBuffer);
        }
        initAttributeVariable(gl, defaultProgram.a_Tagent, obj[i].tagentsBuffer);
        initAttributeVariable(gl, defaultProgram.a_Bitagent, obj[i].bitagentsBuffer);
        initAttributeVariable(gl, defaultProgram.a_crossTexCoord, obj[i].crossTexCoordsBuffer);
        gl.drawArrays(gl.TRIANGLES, 0, obj[i].numVertices);
    }
}


function drawOneObjectOnScreen_v2(obj, mdlMatrix, colorR, colorG, colorB, bumpImg, textureImg, mvpFromLight, shadowTF, vpMatrix) {
    gl.useProgram(defaultProgram);
    var mvpFromCamera = new Matrix4();
    let modelMatrix = new Matrix4();
    modelMatrix.setIdentity();
    modelMatrix.multiply(mdlMatrix);
    // mvpFromCamera.set(vpMatrix);
    mvpFromCamera.set(vpMatrix);
    mvpFromCamera.multiply(modelMatrix);

    //normal matrix
    let normalMatrix = new Matrix4();
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();

    gl.uniform3f(defaultProgram.u_LightPosition, lightX, lightY, lightZ);
    if (povMode == 1.0) {
        gl.uniform3f(defaultProgram.u_ViewPosition, cameraX2, cameraY2, cameraZ2);
    } else {
        gl.uniform3f(defaultProgram.u_ViewPosition, cameraX, cameraY, cameraZ);
    }

    gl.uniform1f(defaultProgram.u_Ka, 0.2);
    gl.uniform1f(defaultProgram.u_Kd, 0.7);
    gl.uniform1f(defaultProgram.u_Ks, 1.0);
    gl.uniform1f(defaultProgram.u_shininess, 40.0);
    gl.uniform3f(defaultProgram.u_Color, colorR, colorG, colorB);


    gl.uniformMatrix4fv(defaultProgram.u_MvpMatrix, false, mvpFromCamera.elements);
    gl.uniformMatrix4fv(defaultProgram.u_modelMatrix, false, modelMatrix.elements);
    gl.uniformMatrix4fv(defaultProgram.u_normalMatrix, false, normalMatrix.elements);

    if (textureImg) {
        gl.uniform1f(defaultProgram.u_TexBool, 1.0);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, textureImg);
        gl.uniform1i(defaultProgram.u_Sampler1, 2);
    } else {
        gl.uniform1f(defaultProgram.u_TexBool, 0.0);
    }
    if (bumpImg) {
        gl.uniform1f(defaultProgram.u_BumpBool, 1.0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, bumpImg);
        gl.uniform1i(defaultProgram.u_bumpMap, 0);
    } else {
        gl.uniform1f(defaultProgram.u_BumpBool, 0.0);
    }
    if (mvpFromLight) {
        if (shadowTF == true) {
            gl.uniform1f(defaultProgram.u_ShadowBool, 1.0);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, fbo.texture);
            gl.uniform1i(defaultProgram.u_ShadowMap, 1);
        } else {
            gl.uniform1f(defaultProgram.u_ShadowBool, 0.0);
        }
        gl.uniformMatrix4fv(defaultProgram.u_MvpMatrixOfLight, false, mvpFromLight.elements);
    } else {
        gl.uniform1f(defaultProgram.u_ShadowBool, 0.0);
    }

    for (let i = 0; i < obj.length; i++) {
        initAttributeVariable(gl, defaultProgram.a_Position, obj[i].vertexBuffer);
        initAttributeVariable(gl, defaultProgram.a_Normal, obj[i].normalBuffer);
        initAttributeVariable(gl, defaultProgram.a_TexCoord, obj[i].texCoordBuffer);
        if (textureImg) {
            initAttributeVariable(gl, defaultProgram.a_TexCoord, obj[i].texCoordBuffer);
        }
        initAttributeVariable(gl, defaultProgram.a_Tagent, obj[i].tagentsBuffer);
        initAttributeVariable(gl, defaultProgram.a_Bitagent, obj[i].bitagentsBuffer);
        initAttributeVariable(gl, defaultProgram.a_crossTexCoord, obj[i].crossTexCoordsBuffer);
        gl.drawArrays(gl.TRIANGLES, 0, obj[i].numVertices);
    }
}





///////////////////////////

function calculateTangentSpace(position, texcoord) {
    //iterate through all triangles
    let tagents = [];
    let bitagents = [];
    let crossTexCoords = [];
    for (let i = 0; i < position.length / 9; i++) {
        let v00 = position[i * 9 + 0];
        let v01 = position[i * 9 + 1];
        let v02 = position[i * 9 + 2];
        let v10 = position[i * 9 + 3];
        let v11 = position[i * 9 + 4];
        let v12 = position[i * 9 + 5];
        let v20 = position[i * 9 + 6];
        let v21 = position[i * 9 + 7];
        let v22 = position[i * 9 + 8];
        let uv00 = texcoord[i * 6 + 0];
        let uv01 = texcoord[i * 6 + 1];
        let uv10 = texcoord[i * 6 + 2];
        let uv11 = texcoord[i * 6 + 3];
        let uv20 = texcoord[i * 6 + 4];
        let uv21 = texcoord[i * 6 + 5];

        let deltaPos10 = v10 - v00;
        let deltaPos11 = v11 - v01;
        let deltaPos12 = v12 - v02;
        let deltaPos20 = v20 - v00;
        let deltaPos21 = v21 - v01;
        let deltaPos22 = v22 - v02;

        let deltaUV10 = uv10 - uv00;
        let deltaUV11 = uv11 - uv01;
        let deltaUV20 = uv20 - uv00;
        let deltaUV21 = uv21 - uv01;

        let r = 1.0 / (deltaUV10 * deltaUV21 - deltaUV11 * deltaUV20);
        for (let j = 0; j < 3; j++) {
            crossTexCoords.push((deltaUV10 * deltaUV21 - deltaUV11 * deltaUV20));
        }
        let tangentX = (deltaPos10 * deltaUV21 - deltaPos20 * deltaUV11) * r;
        let tangentY = (deltaPos11 * deltaUV21 - deltaPos21 * deltaUV11) * r;
        let tangentZ = (deltaPos12 * deltaUV21 - deltaPos22 * deltaUV11) * r;
        for (let j = 0; j < 3; j++) {
            tagents.push(tangentX);
            tagents.push(tangentY);
            tagents.push(tangentZ);
        }
        let bitangentX = (deltaPos20 * deltaUV10 - deltaPos10 * deltaUV20) * r;
        let bitangentY = (deltaPos21 * deltaUV10 - deltaPos11 * deltaUV20) * r;
        let bitangentZ = (deltaPos22 * deltaUV10 - deltaPos12 * deltaUV20) * r;
        for (let j = 0; j < 3; j++) {
            bitagents.push(bitangentX);
            bitagents.push(bitangentY);
            bitagents.push(bitangentZ);
        }
    }
    let obj = {};
    obj['tagents'] = tagents;
    obj['bitagents'] = bitagents;
    obj['crossTexCoords'] = crossTexCoords;
    return obj;
}

function parseOBJ(text) {
    // because indices are base 1 let's just fill in the 0th data
    const objPositions = [
        [0, 0, 0]
    ];
    const objTexcoords = [
        [0, 0]
    ];
    const objNormals = [
        [0, 0, 0]
    ];

    // same order as `f` indices
    const objVertexData = [
        objPositions,
        objTexcoords,
        objNormals,
    ];

    // same order as `f` indices
    let webglVertexData = [
        [], // positions
        [], // texcoords
        [], // normals
    ];

    const materialLibs = [];
    const geometries = [];
    let geometry;
    let groups = ['default'];
    let material = 'default';
    let object = 'default';

    const noop = () => {};

    function newGeometry() {
        // If there is an existing geometry and it's
        // not empty then start a new one.
        if (geometry && geometry.data.position.length) {
            geometry = undefined;
        }
    }

    function setGeometry() {
        if (!geometry) {
            const position = [];
            const texcoord = [];
            const normal = [];
            webglVertexData = [
                position,
                texcoord,
                normal,
            ];
            geometry = {
                object,
                groups,
                material,
                data: {
                    position,
                    texcoord,
                    normal,
                },
            };
            geometries.push(geometry);
        }
    }

    function addVertex(vert) {
        const ptn = vert.split('/');
        ptn.forEach((objIndexStr, i) => {
            if (!objIndexStr) {
                return;
            }
            const objIndex = parseInt(objIndexStr);
            const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
            webglVertexData[i].push(...objVertexData[i][index]);
        });
    }

    const keywords = {
        v(parts) {
            objPositions.push(parts.map(parseFloat));
        },
        vn(parts) {
            objNormals.push(parts.map(parseFloat));
        },
        vt(parts) {
            // should check for missing v and extra w?
            objTexcoords.push(parts.map(parseFloat));
        },
        f(parts) {
            setGeometry();
            const numTriangles = parts.length - 2;
            for (let tri = 0; tri < numTriangles; ++tri) {
                addVertex(parts[0]);
                addVertex(parts[tri + 1]);
                addVertex(parts[tri + 2]);
            }
        },
        s: noop, // smoothing group
        mtllib(parts, unparsedArgs) {
            // the spec says there can be multiple filenames here
            // but many exist with spaces in a single filename
            materialLibs.push(unparsedArgs);
        },
        usemtl(parts, unparsedArgs) {
            material = unparsedArgs;
            newGeometry();
        },
        g(parts) {
            groups = parts;
            newGeometry();
        },
        o(parts, unparsedArgs) {
            object = unparsedArgs;
            newGeometry();
        },
    };

    const keywordRE = /(\w*)(?: )*(.*)/;
    const lines = text.split('\n');
    for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
        const line = lines[lineNo].trim();
        if (line === '' || line.startsWith('#')) {
            continue;
        }
        const m = keywordRE.exec(line);
        if (!m) {
            continue;
        }
        const [, keyword, unparsedArgs] = m;
        const parts = line.split(/\s+/).slice(1);
        const handler = keywords[keyword];
        if (!handler) {
            console.warn('unhandled keyword:', keyword); // eslint-disable-line no-console
            continue;
        }
        handler(parts, unparsedArgs);
    }

    // remove any arrays that have no entries.
    for (const geometry of geometries) {
        geometry.data = Object.fromEntries(
            Object.entries(geometry.data).filter(([, array]) => array.length > 0));
    }

    return {
        geometries,
        materialLibs,
    };
}

function mouseDown(ev) {
    var x = ev.clientX;
    var y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();
    if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
        mouseLastX = x;
        mouseLastY = y;
        mouseDragging = true;
    }
}

function mouseUp(ev) {
    mouseDragging = false;
}

function mouseMove(ev) {
    var x = ev.clientX;
    var y = ev.clientY;
    if (mouseDragging) {
        var factor = 100 / canvas.height; //100 determine the spped you rotate the object
        var dx = factor * (x - mouseLastX);
        var dy = factor * (y - mouseLastY);

        angleX += dx; //yes, x for y, y for x, this is right
        angleY += dy;
    }
    mouseLastX = x;
    mouseLastY = y;

    if (povMode == 0) {
        drawA();
    } else {
        drawB();
    }
}


function callCube() {
    cubeVertices = [
        1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, //this row for the face z = 1.0, T1
        1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, //this row for the face z = 1.0, T2
        1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, //this row for the face x = 1.0,  T1
        1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, //this row for the face x = 1.0,  T2
        1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0, //this row for the face y = 1.0, T1
        1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, //this row for the face y = 1.0, T2
        -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, -1.0, //this row for the face x = -1.0, T1
        -1.0, 1.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, //this row for the face x = -1.0, T2
        -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, //this row for the face y = -1.0, T1
        -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0, //this row for the face y = -1.0, T2
        1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, //this row for the face z = -1.0, T1
        1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, //this row for the face z = -1.0, T2
    ];
    cubeNormals = getNormalOnVertices(cubeVertices);
    let o = initVertexBufferForLaterUse(gl, cubeVertices, cubeNormals, null);
    cube.push(o);
}

function callQuad() {
    quadVertices = [
        1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, //this row for the face z = 1.0, T1
        1.0, 1.0, 1.0, -1.0, -1.0, 1.0,
        1.0, -1.0, 1.0, //this row for the face z = 1.0, T2
    ];
    quadT = [
        1.0, 1.0, //
        0.0, 1.0, //
        0.0, 0.0, //
        1.0, 1.0, //
        0.0, 0.0, //
        1.0, 0.0, //
    ];

    //////////////getNormalOnVertices(cubeVertices);
    quadNormals = getNormalOnVertices(quadVertices);
    let o = initVertexBufferForLaterUse(gl, quadVertices, quadNormals, quadT);
    monitor.push(o);
}


function getNormalOnVertices(vertices) {
    var normals = [];
    var nTriangles = vertices.length / 9;
    for (let i = 0; i < nTriangles; i++) {
        var idx = i * 9 + 0 * 3;
        var p0x = vertices[idx + 0],
            p0y = vertices[idx + 1],
            p0z = vertices[idx + 2];
        idx = i * 9 + 1 * 3;
        var p1x = vertices[idx + 0],
            p1y = vertices[idx + 1],
            p1z = vertices[idx + 2];
        idx = i * 9 + 2 * 3;
        var p2x = vertices[idx + 0],
            p2y = vertices[idx + 1],
            p2z = vertices[idx + 2];

        var ux = p1x - p0x,
            uy = p1y - p0y,
            uz = p1z - p0z;

        var vx = p2x - p0x,
            vy = p2y - p0y,
            vz = p2z - p0z;

        var nx = uy * vz - uz * vy;
        var ny = uz * vx - ux * vz;
        var nz = ux * vy - uy * vx;

        var norm = Math.sqrt(nx * nx + ny * ny + nz * nz);
        nx = nx / norm;
        ny = ny / norm;
        nz = nz / norm;

        normals.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
    }
    return normals;
}

function initTexture(gl, img, imgName) {
    var tex = gl.createTexture();
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    // Set the parameters so we can render any size image.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    // Upload the image into the texture.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    textures[imgName] = tex;

    texCount++;
    if (texCount == numTextures) {
        if (povMode == 0) {
            drawA();
        } else {
            drawB();
        }
    };
}

/*
function pushMatrix(matstack) {
    matstack.push(new Matrix4(transformMat));
}

function popMatrix(matstack) {
    transformMat = matstack.pop();
}
*/

function initFrameBuffer(gl) {
    //create and set up a texture object as the color buffer
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, offScreenWidth, offScreenHeight,
        0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    //create and setup a render buffer as the depth buffer
    var depthBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16,
        offScreenWidth, offScreenHeight);
    //create and setup framebuffer: link the color and depth buffer to it
    var frameBuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D, texture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,
        gl.RENDERBUFFER, depthBuffer);
    frameBuffer.texture = texture;
    return frameBuffer;
}

function initFrameBufferForCubemapRendering(gl) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
    // 6 2D textures
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    for (let i = 0; i < 6; i++) {
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0,
            gl.RGBA, offScreenWidth, offScreenHeight, 0, gl.RGBA,
            gl.UNSIGNED_BYTE, null);
    }
    //create and setup a render buffer as the depth buffer
    var depthBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16,
        offScreenWidth, offScreenHeight);
    //create and setup framebuffer: linke the depth buffer to it (no color buffer here)
    var frameBuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,
        gl.RENDERBUFFER, depthBuffer);
    frameBuffer.texture = texture;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return frameBuffer;
}


function renderCubeMap(camX, camY, camZ) {
    var ENV_CUBE_LOOK_DIR = [
        [1.0, 0.0, 0.0],
        [-1.0, 0.0, 0.0],
        [0.0, 1.0, 0.0],
        [0.0, -1.0, 0.0],
        [0.0, 0.0, 1.0],
        [0.0, 0.0, -1.0]
    ];
    var ENV_CUBE_LOOK_UP = [
        [0.0, -1.0, 0.0],
        [0.0, -1.0, 0.0],
        [0.0, 0.0, 1.0],
        [0.0, 0.0, -1.0],
        [0.0, -1.0, 0.0],
        [0.0, -1.0, 0.0]
    ];
    gl.useProgram(program2);
    gl.bindFramebuffer(gl.FRAMEBUFFER, dynamicFbo);
    gl.viewport(0, 0, offScreenWidth, offScreenHeight);
    gl.clearColor(0.4, 0.4, 0.4, 1);
    for (var side = 0; side < 6; side++) {

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + side, dynamicFbo.texture, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        let vpMatrix = new Matrix4();
        vpMatrix.setPerspective(90, 1, 1, 100);
        vpMatrix.lookAt(camX, camY, camZ,
            camX + ENV_CUBE_LOOK_DIR[side][0],
            camY + ENV_CUBE_LOOK_DIR[side][1],
            camZ + ENV_CUBE_LOOK_DIR[side][2],
            ENV_CUBE_LOOK_UP[side][0],
            ENV_CUBE_LOOK_UP[side][1],
            ENV_CUBE_LOOK_UP[side][2]);
        if (povMode == 1.0) {

        } else {
            drawRegularObjects(vpMatrix);
        }

        /////////////add
        drawEnvMap(vpMatrix);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

function drawObjectWithDynamicReflection(obj, mdlMatrix, vpMatrix, colorR, colorG, colorB) {
    gl.useProgram(programTextureOnCube);

    var mvpFromCamera = new Matrix4();
    let modelMatrix = new Matrix4();
    modelMatrix.setIdentity();
    modelMatrix.multiply(mdlMatrix);

    mvpFromCamera.setPerspective(60, 1, 1, 100);
    //改成w,s按鍵以view direction前進
    mvpFromCamera.lookAt(cameraX, cameraY, cameraZ,
        cameraX + newViewDir.elements[0],
        cameraY + newViewDir.elements[1],
        cameraZ + newViewDir.elements[2],
        0, 1, 0);

    mvpFromCamera.multiply(modelMatrix);

    //normal matrix
    let normalMatrix = new Matrix4();
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();

    gl.uniform3f(programTextureOnCube.u_ViewPosition, cameraX, cameraY, cameraZ);
    gl.uniform3f(programTextureOnCube.u_Color, colorR, colorG, colorB);

    gl.uniformMatrix4fv(programTextureOnCube.u_MvpMatrix, false, mvpFromCamera.elements);
    //gl.uniformMatrix4fv(programTextureOnCube.u_MvpMatrix, false, mvpFromCamera.elements);
    gl.uniformMatrix4fv(programTextureOnCube.u_modelMatrix, false, modelMatrix.elements);
    gl.uniformMatrix4fv(programTextureOnCube.u_normalMatrix, false, normalMatrix.elements);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, dynamicFbo.texture);
    gl.uniform1i(programTextureOnCube.u_envCubeMap, 0);

    for (let i = 0; i < obj.length; i++) {
        initAttributeVariable(gl, programTextureOnCube.a_Position, obj[i].vertexBuffer);
        initAttributeVariable(gl, programTextureOnCube.a_Normal, obj[i].normalBuffer);
        gl.drawArrays(gl.TRIANGLES, 0, obj[i].numVertices);
    }
    //
}


function drawObjectWithDynamicReflectionB(obj, mdlMatrix, vpMatrix, colorR, colorG, colorB) {
    gl.useProgram(programTextureOnCube);

    var mvpFromCamera = new Matrix4();
    let modelMatrix = new Matrix4();
    modelMatrix.setIdentity();
    modelMatrix.multiply(mdlMatrix);

    mvpFromCamera.setPerspective(60, 1, 1, 100);
    //改成w,s按鍵以view direction前進
    mvpFromCamera.lookAt(cameraX2, cameraY2, cameraZ2,
        0, 0, 0,
        0, 1, 0);

    mvpFromCamera.multiply(modelMatrix);

    //normal matrix
    let normalMatrix = new Matrix4();
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();

    gl.uniform3f(programTextureOnCube.u_ViewPosition, cameraX, cameraY, cameraZ);
    gl.uniform3f(programTextureOnCube.u_Color, colorR, colorG, colorB);

    gl.uniformMatrix4fv(programTextureOnCube.u_MvpMatrix, false, mvpFromCamera.elements);
    //gl.uniformMatrix4fv(programTextureOnCube.u_MvpMatrix, false, mvpFromCamera.elements);
    gl.uniformMatrix4fv(programTextureOnCube.u_modelMatrix, false, modelMatrix.elements);
    gl.uniformMatrix4fv(programTextureOnCube.u_normalMatrix, false, normalMatrix.elements);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, dynamicFbo.texture);
    gl.uniform1i(programTextureOnCube.u_envCubeMap, 0);

    for (let i = 0; i < obj.length; i++) {
        initAttributeVariable(gl, programTextureOnCube.a_Position, obj[i].vertexBuffer);
        initAttributeVariable(gl, programTextureOnCube.a_Normal, obj[i].normalBuffer);
        gl.drawArrays(gl.TRIANGLES, 0, obj[i].numVertices);
    }
    //
}

function keydown(ev) {
    //implment keydown event here
    let rotateMatrix = new Matrix4();
    rotateMatrix.setRotate(angleY, 1, 0, 0); //for mouse rotation
    rotateMatrix.rotate(angleX, 0, 1, 0); //for mouse rotation
    var viewDir = new Vector3([cameraDirX, cameraDirY, cameraDirZ]);
    var newViewDir = rotateMatrix.multiplyVector3(viewDir);

    if (ev.key == "p") {
        if (povMode == 0) {
            povMode = 1;
            console.log("povMode" + povMode);
        } else {
            povMode = 0;
            console.log("povMode" + povMode);
        }
    }

    if (ev.key == 'w') {
        cameraX += (newViewDir.elements[0] * 0.1);
        //cameraY += (newViewDir.elements[1] * 0.1);
        cameraZ += (newViewDir.elements[2] * 0.1);

        playerX += (newViewDir.elements[0] * 0.1);
        playerZ += (newViewDir.elements[2] * 0.1);
    } else if (ev.key == 's') {
        cameraX -= (newViewDir.elements[0] * 0.1);
        // cameraY -= (newViewDir.elements[1] * 0.1);
        cameraZ -= (newViewDir.elements[2] * 0.1);

        playerX -= (newViewDir.elements[0] * 0.1);
        playerZ -= (newViewDir.elements[2] * 0.1);
    } else if (ev.key == 'a') {
        cameraX -= 0.05;
        //cameraY -= (newViewDir.elements[1] * 0.1);
        //cameraZ -= (newViewDir.elements[2] * 0.1);

        playerX -= 0.05;
    } else if (ev.key == 'd') {
        cameraX += 0.05;
        //cameraY += (newViewDir.elements[1] * 0.1);
        // cameraZ += (newViewDir.elements[2] * 0.1);

        playerX += 0.05;
    }
    if (povMode == 0) {
        drawA();
    } else {
        drawB();
    }
}

async function loadOBJtoCreateVBO(objFile) {
    let objComponents = [];
    response = await fetch(objFile);
    text = await response.text();
    obj = parseOBJ(text);
    for (let i = 0; i < obj.geometries.length; i++) {
        let tagentSpace = calculateTangentSpace(obj.geometries[i].data.position,
            obj.geometries[i].data.texcoord);
        let o = initVertexBufferForLaterUse(gl,
            obj.geometries[i].data.position,
            obj.geometries[i].data.normal,
            obj.geometries[i].data.texcoord,
            tagentSpace.tagents,
            tagentSpace.bitagents,
            tagentSpace.crossTexCoords);
        objComponents.push(o);
    }
    return objComponents;
}


function drawRegularObjects(vpMatrix) {
    let mdlMatrix = new Matrix4();
    mdlMatrix.setTranslate(rx - 0.5, ry + 0.2, rz + 0.0);
    mdlMatrix.rotate(rotateAngle, 0, 1, 0);
    mdlMatrix.translate(rx + 0.0, 0.5, 0.0);
    mdlMatrix.scale(0.05, 0.05, 0.05);
    drawOneRegularObject(cubeObj, mdlMatrix, vpMatrix, 0.4, 1.0, 0.4);

    let mdl2Matrix = new Matrix4();
    mdl2Matrix.setTranslate(rx - 0.0, ry + 0.5, rz + 0.0);
    mdl2Matrix.rotate(rotateAngle, 0, 1, 0);
    mdl2Matrix.translate(0.0, 0.5, 0.0);
    mdl2Matrix.scale(0.05, 0.05, 0.05);
    drawOneRegularObject(cubeObj, mdl2Matrix, vpMatrix, 1.0, 0.4, 0.4);


    let fMdlMatrix = new Matrix4();
    fMdlMatrix.setTranslate(-0.9, 0.0, 0.5);
    fMdlMatrix.rotate(45, 0, 1, 0);
    fMdlMatrix.scale(0.01, 0.01, 0.01);
    //let fMvpFromLight = drawOffScreen_v2(fox, fMdlMatrix, vpMatrix);
    //drawOneRegularObject(fox, mdlMatrix3, vpMatrix, 0.4, 1.0, 0.4);
    drawOneObjectOnScreen_v2(fox, fMdlMatrix, 1.0, 1.0, 1.0, null, textures[foxCompImgIndex[0]], null, false, vpMatrix);
    //drawOneObject_regular(fox, mdlMatrix3, vpMatrix, 0.4, 1.0, 0.4, foxCompImgIndex);

    let groundMdlMatrix = new Matrix4();
    groundMdlMatrix.setIdentity();
    groundMdlMatrix.translate(0.0, -1.7, -0.5);
    groundMdlMatrix.scale(2.9, 1.5, 2.9);
    drawOneObjectOnScreen_v2(cubeObj, groundMdlMatrix, 1.0, 1.0, 1.0, textures["normalMapImage"], textures["tex01"], null, true, vpMatrix);

    let benchMdlMatrix = new Matrix4();
    benchMdlMatrix.setTranslate(0.0, 0.0, 0.0);
    benchMdlMatrix.scale(0.005, 0.005, 0.005);
    //let benchMvpFromLight = drawOffScreen(bench, benchMdlMatrix);
    drawOneObjectOnScreen_v2(bench, benchMdlMatrix, 1.0, 1.0, 1.0, null, textures[benchCompImgIndex[0]], null, true, vpMatrix);


    let tvMdlMatrix = new Matrix4();
    tvMdlMatrix.setTranslate(1.1, 0.0, -0.5);
    tvMdlMatrix.rotate(30, 0.0, 1, 0.0);
    tvMdlMatrix.scale(0.2, 0.2, 0.2);
    /// let tvMvpFromLight = drawOffScreen(tv, tvMdlMatrix);
    drawOneObjectOnScreen_v2(tv, tvMdlMatrix, 0.15, 0.1, 0.1, null, null, null, true, vpMatrix);
    //drawOneObjectOnScreen(guitar, guitarMdlMatrix, 0.15, 0.1, 0.1, null, textures[guitarCompImgIndex[0]], guitarMvpFromLight, true);

    let playerMdlMatrix = new Matrix4();
    playerMdlMatrix.setTranslate(playerX, playerY, playerZ);
    playerMdlMatrix.rotate(180 + angleX, 0, 1, 0);
    playerMdlMatrix.scale(0.01, 0.01, 0.01);
    drawOneObjectOnScreen_v2(fox, playerMdlMatrix, 1.0, 1.0, 1.0, null, textures[foxCompImgIndex[0]], null, true, vpMatrix);
    //let playerMvpFromLight = drawOffScreen(fox, playerMdlMatrix);
}

function drawOneRegularObject(obj, mdlMatrix, vpMatrix, colorR, colorG, colorB) {
    gl.useProgram(program2);

    let mvpMatrix = new Matrix4();
    let normalMatrix = new Matrix4();
    mvpMatrix.set(vpMatrix);
    mvpMatrix.multiply(mdlMatrix);

    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();


    gl.uniform3f(program2.u_LightPosition, lightX, lightY, lightZ);
    gl.uniform3f(program2.u_ViewPosition, cameraX, cameraY, cameraZ);
    gl.uniform1f(program2.u_Ka, 0.2);
    gl.uniform1f(program2.u_Kd, 0.7);
    gl.uniform1f(program2.u_Ks, 1.0);
    gl.uniform1f(program2.u_shininess, 10.0);
    gl.uniform3f(program2.u_Color, colorR, colorG, colorB);

    gl.uniformMatrix4fv(program2.u_MvpMatrix, false, mvpMatrix.elements);
    //gl.uniformMatrix4fv(program2.u_MvpMatrix, false, mvpFromCamera.elements);
    gl.uniformMatrix4fv(program2.u_modelMatrix, false, mdlMatrix.elements);
    gl.uniformMatrix4fv(program2.u_normalMatrix, false, normalMatrix.elements);

    for (let i = 0; i < obj.length; i++) {
        initAttributeVariable(gl, program2.a_Position, obj[i].vertexBuffer);
        initAttributeVariable(gl, program2.a_Normal, obj[i].normalBuffer);
        gl.drawArrays(gl.TRIANGLES, 0, obj[i].numVertices);
    }
}

function drawEnvMap(vpFromCamera) {
    var vpFromCameraInverse = vpFromCamera.invert();
    gl.useProgram(programEnvCube);
    gl.depthFunc(gl.LEQUAL);
    gl.uniformMatrix4fv(programEnvCube.u_viewDirectionProjectionInverse,
        false, vpFromCameraInverse.elements);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTex);
    gl.uniform1i(programEnvCube.u_envCubeMap, 0);
    initAttributeVariable(gl, programEnvCube.a_Position, quadObj.vertexBuffer);
    gl.drawArrays(gl.TRIANGLES, 0, quadObj.numVertices);
}

function initCubeTexture(posXName, negXName, posYName, negYName,
    posZName, negZName, imgWidth, imgHeight) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
    const faceInfos = [{
            target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
            fName: posXName,
        },
        {
            target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
            fName: negXName,
        },
        {
            target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
            fName: posYName,
        },
        {
            target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
            fName: negYName,
        },
        {
            target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
            fName: posZName,
        },
        {
            target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
            fName: negZName,
        },
    ];
    faceInfos.forEach((faceInfo) => {
        const { target, fName } = faceInfo;
        // setup each face so it's immediately renderable
        //void gl.texImage2D(target, level, internalformat, width, height, border, format, type, ImageData source);
        gl.texImage2D(target, 0, gl.RGBA, imgWidth, imgHeight, 0,
            gl.RGBA, gl.UNSIGNED_BYTE, null);
        //一個個initTexture
        var image = new Image();
        image.onload = function() {
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
            gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        };
        image.src = fName;
    });
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

    return texture;
}