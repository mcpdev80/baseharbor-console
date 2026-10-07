import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawn } from "node:child_process";
import { createHash, X509Certificate } from "node:crypto";

// Exercise the production CLI authoring and authenticated operator HTTP boundary.
// Only the isolated source repository and test process configuration are authored;
// applied publications, readiness, grants and execution results come from Core.
export async function qualifyRemoteApplicationJourney(page, root, origin, token) {
  const runtime = process.env.BASEHARBOR_BROWSER_REMOTE_RUNTIME;
  assert.ok(["docker", "podman"].includes(runtime));
  const binary = process.env.BASEHARBOR_TEST_CONNECTOR_BIN;
  assert.ok(binary && path.isAbsolute(binary) && fs.statSync(binary).isFile());
  const image = process.env.BASEHARBOR_CONNECTOR_RUNTIME_IMAGE;
  assert.match(image, /@sha256:[0-9a-f]{64}$/);
  const env = { ...process.env, XDG_DATA_HOME: path.join(root,"data"), XDG_CONFIG_HOME: path.join(root,"config"), BASEHARBOR_PROVIDER_POSTGRESQL_SCOPE: "application" };
  const run = (command,args,options={}) => execFileSync(command,args,{encoding:"utf8",timeout:60000,stdio:["ignore","pipe","pipe"],...options});
  const pause = ms => new Promise(resolve => setTimeout(resolve,ms));
  const config = path.join(root,"config","baseharbor","config.yaml");
  const originalConfig = fs.readFileSync(config,"utf8");
  const target = "browser-node", node = "node-browser", application = "remote-http";
  let connector;
  let completed=false;
  const observations=[];
  try {
    // This is an explicit tenant-owned target selection, never a request-selected
    // signing authority or a fallback to the local Docker execution target.
    const signingDir = path.join(process.env.BASEHARBOR_BROWSER_CORE_SOURCE,"scripts","browser-connector-signing");
    fs.mkdirSync(signingDir,{recursive:true});
    fs.copyFileSync("scripts/browser/sign-connector-core.go",path.join(signingDir,"main.go"));
    run("go",["run","./scripts/browser-connector-signing","--configure-target"],{cwd:process.env.BASEHARBOR_BROWSER_CORE_SOURCE,env,timeout:120000});
    run("go",["run","./scripts/browser-connector-signing"],{cwd:process.env.BASEHARBOR_BROWSER_CORE_SOURCE,env,timeout:120000});
    const apiEnv = { ...env, BASEHARBOR_API_OIDC_ISSUER: origin+"/realms/baseharbor-browser", BASEHARBOR_API_OIDC_AUDIENCES:"baseharbor-api", SSL_CERT_FILE:path.join(root,"ca.crt"), BASEHARBOR_API_LISTEN_ADDR:"127.0.0.1:19443", BASEHARBOR_API_TLS_CERT_FILE:path.join(root,"connector-core.crt"), BASEHARBOR_API_TLS_KEY_FILE:path.join(root,"connector-core.key"), BASEHARBOR_LOGS_ENABLED:"false", BASEHARBOR_CONNECTOR_ENROLLMENT_ENABLED:"true", BASEHARBOR_CONNECTOR_AUTHORITY_TARGET:"browser-runtime", BASEHARBOR_CONNECTOR_LISTEN_ADDR:"127.0.0.1:19444", BASEHARBOR_CONNECTOR_TLS_CERT_FILE:path.join(root,"connector-core.crt"), BASEHARBOR_CONNECTOR_TLS_KEY_FILE:path.join(root,"connector-core.key"), BASEHARBOR_CONNECTOR_TLS_CA_FILE:path.join(root,"connector-ca.pem") };
    const oldPID=Number(fs.readFileSync(path.join(root,"core.pid"),"utf8")); assert.ok(Number.isSafeInteger(oldPID)&&oldPID>1); process.kill(oldPID,"SIGTERM");
    let stopped=false;
    for(let count=0;count<300;count++){try{process.kill(oldPID,0);await pause(100);}catch{stopped=true;break;}}
    assert.ok(stopped,"Original Core did not stop before its replacement");
    const log = fs.openSync(path.join(root,"remote-core.log"),"a",0o600);
    const core=spawn(path.join(root,"baha"),["serve"],{cwd:path.join(root,"work"),env:apiEnv,stdio:["ignore",log,log]}); fs.closeSync(log);core.unref();
    fs.writeFileSync(path.join(root,"core.pid"),String(core.pid),{mode:0o600});
    function startupFailure(){
      const lines=fs.readFileSync(path.join(root,"remote-core.log"),"utf8").split("\n");
      return lines.filter(line=>line.startsWith("Error:")).map(line=>line.replace(/(?:postgres(?:ql)?|https?):\/\/\S+/g,"[endpoint]")).join("; ") || "no CLI error recorded";
    }
    let ready=false;
    for(let count=0;count<90;count++){assert.equal(core.exitCode,null,"Production Core exited during Connector startup: "+startupFailure());try{const reply=await page.request.get("https://localhost:19443/readyz",{timeout:2000});if(reply.ok()){ready=true;break;}}catch{} await pause(1000);}
    assert.ok(ready,"Production Core with enrollment did not become ready");
    const headers={Authorization:"Bearer "+token};
    const grant=await page.request.post(origin+"/api/v1/connectors/authorizations",{headers,data:{target_id:target,node_id:node,environment:"dev",lifetime_seconds:300,certificate_ttl_seconds:3600}}); assert.equal(grant.status(),201,"Real operator Connector grant denied");
    const nodeRoot=path.join(root,"connector-node");fs.mkdirSync(nodeRoot,{mode:0o700});
    const authorization=path.join(nodeRoot,"authorization.json");fs.writeFileSync(authorization,JSON.stringify(await grant.json()),{mode:0o600});
    const args=["--runtime",runtime,"--core","127.0.0.1:19444","--server-name","localhost","--core-identity","spiffe://baseharbor/platform/core/browser-connector","--tenant-id","11111111-1111-4111-8111-111111111111","--target-id",target,"--node-id",node,"--sessions","1","--state-root",path.join(nodeRoot,"state"),"--quadlet-root",path.join(process.env.XDG_RUNTIME_DIR,"containers","systemd"),"--cert",path.join(nodeRoot,"node.crt"),"--key",path.join(nodeRoot,"node.key"),"--ca",path.join(nodeRoot,"ca.pem"),"--bootstrap-url","https://localhost:19443/api/v1/connectors/enroll","--bootstrap-ca",path.join(root,"connector-ca.pem"),"--bootstrap-authorization-file",authorization];
    const nodeLog=fs.openSync(path.join(root,"connector.log"),"a",0o600);
    connector=spawn(binary,args,{env,stdio:["ignore",nodeLog,nodeLog]});fs.closeSync(nodeLog);connector.unref();
    fs.writeFileSync(path.join(root,"connector.pid"),String(connector.pid),{mode:0o600});
    const context={application,environment:"dev",target};
    async function execute(operation,input={},selected=context){
      const admitted=await page.request.post(origin+"/api/v1/machine/executions",{headers,data:{operation_id:operation,context:selected,input},timeout:15000});
      assert.equal(admitted.status(),202,`Native ${operation} admission denied`);
      let value=await admitted.json();const id=value.execution_id; assert.ok(id);
      const until=Date.now()+180000;
      while(!["succeeded","failed","cancelled"].includes(value.state)&&Date.now()<until){await pause(1000);const observed=await page.request.get(origin+"/api/v1/machine/executions/"+id,{headers,timeout:15000});assert.equal(observed.status(),200);value=await observed.json();}
      observations.push({operation,state:value.state,code:value.error?.code,cause:value.error?.cause});
      assert.equal(value.actor.subject,"55555555-5555-4555-8555-555555555555"); assert.deepEqual(value.context,selected);
      assert.equal(value.state,"succeeded",`Native ${operation}: ${value.error?.code}/${value.error?.cause}`);return value;
    }
    function records(directory){return fs.readdirSync(directory,{withFileTypes:true}).flatMap(item=>item.isDirectory()?records(path.join(directory,item.name)):item.name==="deployment.json"?[path.join(directory,item.name)]:[]);}
    for(let count=0;count<60&&!fs.existsSync(path.join(nodeRoot,"node.crt"));count++){assert.equal(connector.exitCode,null,"Actual Connector exited during enrollment: "+fs.readFileSync(path.join(root,"connector.log"),"utf8").trim().replace(/https?:\/\/\S+/g,"[endpoint]"));await pause(1000);}
    assert.ok(fs.existsSync(path.join(nodeRoot,"node.crt")));assert.ok(!fs.existsSync(authorization),"One-use grant remained on disk");
    const leaf=new X509Certificate(fs.readFileSync(path.join(nodeRoot,"node.crt")));assert.ok(leaf.subjectAltName.includes(`URI:spiffe://baseharbor/platform/connectors/11111111-1111-4111-8111-111111111111/${target}/${node}`));
    run(path.join(root,"baha"),["--target",target,"app","create",application,"--sql","--workload-component","api","--environment","dev"],{env,cwd:path.join(root,"work")});
    const matching=records(path.join(root,"data","baseharbor","targets",target)).map(file=>({file,value:JSON.parse(fs.readFileSync(file,"utf8"))})).filter(row=>row.value.identity.application===application);assert.equal(matching.length,1);
    const recordPath=matching[0].file,source=matching[0].value.source.repository;
    fs.writeFileSync(path.join(source,"compose.yaml"),`services:\n  api:\n    image: ${image}\n    user: '1000:1000'\n    read_only: true\n    command: ['sleep', '900']\n    healthcheck:\n      test: ['CMD', 'test', '-r', '/run/baseharbor/service-bindings/postgres/uri']\n      interval: 1s\n      timeout: 1s\n      retries: 20\n`,{mode:0o600});
    await execute("plan");
    const applied=await execute("apply");assert.equal(applied.result.status.ready,true);
    const published=JSON.parse(fs.readFileSync(recordPath,"utf8")).applied.remote_project;assert.ok(published&&published.scope.TargetID===target&&published.scope.Runtime===runtime);
    const project=published.bundle_id;assert.match(project,/^[a-zA-Z0-9_.-]+$/);
    const owned=()=>JSON.parse(run(runtime,["inspect",...run(runtime,["ps","-aq","--filter","label=com.docker.compose.project="+project]).trim().split(/\s+/).filter(Boolean)]));
    const before=owned();const postgres=before.find(item=>item.Config.Labels["com.docker.compose.service"]==="postgres"),workload=before.find(item=>item.Config.Labels["com.docker.compose.service"]==="api");assert.ok(postgres&&workload);assert.equal((workload.State.Health?.Status ?? workload.State.Healthcheck?.Status),"healthy");
    const status=await execute("status");assert.equal(status.result.ready,true);assert.equal((await execute("doctor")).result.healthy,true);
    run(runtime,["rm","-f",workload.Id]);
    assert.equal((await execute("status")).result.ready,false);assert.equal((await execute("doctor")).result.healthy,false);
    fs.writeFileSync(path.join(source,"compose.yaml"),"services:\n  foreign:\n    image: invalid.example/never-activate:latest\n",{mode:0o600});
    const repair=await execute("repair");assert.equal(repair.result.doctor.healthy,true);
    assert.equal(owned().find(item=>item.Config.Labels["com.docker.compose.service"]==="postgres").Id,postgres.Id,"Repair restarted healthy provider");
    assert.equal((await execute("status")).result.ready,true);assert.equal((await execute("doctor")).result.healthy,true);
    await execute("destroy",{approval:true,full_reset:true});
    for(const selection of [["ps","-aq"],["volume","ls","-q"],["network","ls","-q"]])assert.equal(run(runtime,[...selection,"--filter","label=com.docker.compose.project="+project]).trim(),"","Owned Application cleanup incomplete");
    assert.equal(run("docker",["inspect","--format","{{.State.Running}}",fs.readFileSync(path.join(root,"keycloak.container"),"utf8").trim()]).trim(),"true");
    completed=true;
    fs.writeFileSync(path.join(root,"remote-http-receipt.json"),JSON.stringify({schema:"baseharbor.remote-http-journey/v1",core_commit:process.env.BASEHARBOR_BROWSER_CORE_COMMIT,connector_binary_sha256:createHash("sha256").update(fs.readFileSync(binary)).digest("hex"),runtime,result:"success",cleanup_result:"success",production_authority:true,observations},null,2)+"\n",{mode:0o600});
    return ["actual-operator-HTTP-production-enrollment-outbound-Connector-application-plan-apply-status-doctor-immutable-repair-destroy-and-owned-cleanup"];
  } catch (error) {
    console.error(JSON.stringify({ remote_http_failure: error.code === "ERR_ASSERTION" ? error.message : error.name }));
    throw error;
  } finally {
    console.log(JSON.stringify({remote_http_journey:observations,result:completed?"success":"failure"}));
    if(connector){connector.kill("SIGTERM");await pause(500);}
    fs.writeFileSync(config,originalConfig,{mode:0o600});
    // Core remains serving on the original API and authoritative local target.
    // Emergency fixture cleanup is never accepted as successful journey proof.
  }
}
