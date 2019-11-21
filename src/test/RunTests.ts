import { MBitArray } from "../boofer-files/toy/helpers/MBitArray";
import { MByteUtils } from "../boofer-files/toy/Util/MByteUtils";
import { Vector3 } from "babylonjs";
import { fail } from "assert";

function assert(theTruth : boolean, msg ? : string) 
{
    console.log(`${theTruth ? 'PASS' : 'FAIL'} ${msg? msg : ''}`);
    return theTruth;
}

function assertPassQuietly(theTruth : boolean, failMsg ? : string)
{
    if(!theTruth) {
        console.log(`FAIL ${failMsg? failMsg : ''}`);
    }
    return theTruth;
}


function assertEqual(a : any, b: any, msg ?: string)
{
    console.log(`${a === b ? 'PASS' : 'FAIL'} a: ${a} b: ${b} ${msg ? msg : ''}`);
}

function checkVecConversion(vin : Vector3)
{
    const vstr = MByteUtils.Vec3ToUint8String(vin);
    const vout = MByteUtils.Uint8StringToVec3(vstr);
    const check = vin.equals(vout)
    return assert(check, `${vin} eq ${vout}`);
}

function checkVecToUint8sAndBack(vin : Vector3)
{
    const buff = MByteUtils.Vec3ToArrayBuffer(vin);
    const floats = new Float32Array(buff);
    const vout = new Vector3(floats[0], floats[1], floats[2]); // Vector3.FromArray(floats);
    const check = vout.equals(vin);
    return assert(check, `${vin} eq u8 ${vout}`);
}

function dec2bin(dec : number){ return (dec >>> 0).toString(2); }

function checkAFloatToUint8s(f : number)
{
    const buff = new ArrayBuffer(4);
    const floats = new Float32Array(buff);
    floats[0] = f;
    console.log(`floats[0] = ${floats[0]} === f: ${f} ${floats[0] === f}`);

    const uints = new Uint8Array(buff);

    console.log(`floa str: ${dec2bin(f)}`);
    console.log(`flo0 str: ${dec2bin(floats[0])}`);
    console.log(`uint str: ${MByteUtils.DebugUint8To01String(uints)}`);

    const moreFloats = new Float32Array(uints.buffer);
    console.log(`mfl0 str: ${dec2bin(moreFloats[0])}`);
}

function runTests(pow : number, negativeMax ? : boolean)
{
    const fMax = Math.pow(2, pow) - 1;
    const sign = (negativeMax === true ? -1 : 1);
    let vin = new Vector3((fMax) * sign,2,3);
    let allPassed = 0;
    let testCount = 10;
    let fails = new Array<Vector3>();
    for(let i=0; i< testCount; ++i)
    {
        if(checkVecToUint8sAndBack(vin)) {
            allPassed++;
        } else {
            fails.push(vin.clone());
        }
        vin.addInPlace(new Vector3(sign, 0, 0));
    }

    
    // fails.forEach((v) => {
    //     console.log(`failed at ${v}`);
    // });
    console.log(`${allPassed} / ${testCount} passed`);
    return allPassed === testCount;
}

function testVecConversions()
{
    let maxPass = 0;
    let negMaxPass = 0;
    for(let i = 0; i < 16; ++i) 
    {
        const pow = i + 15;
        if(runTests(pow, false)) {
            console.log(`PASS for pow ${pow}`);
            maxPass = pow;
        } else {
            console.log(`FAIL for pow ${pow}`);
        }

        if(runTests(pow, true)) {
            console.log(`neg PASS for pow ${pow}`);
            negMaxPass = pow;
        } else {
            console.log(`neg FAIL for pow ${pow}`);
        }
    }
    console.log(`max pass: ${maxPass}, neg max pass: ${negMaxPass}`);
}

function testFloatConversions(p : number)
{
    let f = Math.pow(2, p) - 1;
    console.log(`***2^${p} - 1***`);
    checkAFloatToUint8s(f);
}

testFloatConversions(3)
testFloatConversions(15)
testFloatConversions(22);
testFloatConversions(23);
testFloatConversions(24);
// number -> float32 array fails to preserve 
// the original value somewhere around 2^24
testFloatConversions(25);
testFloatConversions(31);
