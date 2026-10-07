// Test-only fixture: register one actually started, isolated terminal workload.
package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"github.com/mcpdev80/baseharbor/internal/application"
	"github.com/mcpdev80/baseharbor/internal/deployment"
)

func main() {
	root := os.Getenv("BASEHARBOR_BROWSER_FIXTURE")
	if !filepath.IsAbs(root) || os.Getenv("XDG_DATA_HOME") != filepath.Join(root, "data") {
		panic("isolated browser state required")
	}
	manifest := application.WithWorkloadComponents(application.Manifest{Version: application.CurrentVersion, ApplicationID: application.MustNewApplicationID(), Name: "browser-terminal", Environment: "dev"}, "shell")
	identity, err := deployment.NewDeploymentIdentity("browser-runtime", manifest.ApplicationID, manifest.Name, manifest.Environment)
	if err != nil {
		panic(err)
	}
	intent, err := json.Marshal(manifest)
	if err != nil {
		panic(err)
	}
	record := deployment.DeploymentRecord{Identity: identity, Source: deployment.DeploymentSource{Kind: "browser-terminal-fixture"}, Applied: deployment.AppliedDeployment{Intent: intent, RuntimeProvider: "docker"}}
	if err := deployment.SaveDeploymentRecord(record); err != nil {
		panic(err)
	}
	files := application.RuntimeFilesFor(application.Store{Namespace: "browser-runtime"}, manifest)
	fmt.Println(application.WorkloadProjectNameForRuntime(manifest, files))
}
