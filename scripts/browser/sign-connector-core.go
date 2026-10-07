package main

import (
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"time"

	"github.com/mcpdev80/baseharbor/internal/deployment"
	"github.com/mcpdev80/baseharbor/internal/openbao"
	bhruntime "github.com/mcpdev80/baseharbor/internal/runtime"
	"github.com/mcpdev80/baseharbor/internal/serviceaccess"
)

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
func run() error {
	if len(os.Args) == 2 && os.Args[1] == "--configure-target" {
		runtime := os.Getenv("BASEHARBOR_BROWSER_REMOTE_RUNTIME")
		if runtime != "docker" && runtime != "podman" {
			return fmt.Errorf("explicit native remote runtime required")
		}
		cfg, err := deployment.LoadConfig()
		if err != nil {
			return err
		}
		authority, err := cfg.ResolveTarget("browser-runtime", "")
		if err != nil || authority.AccessProvider != "local" || authority.RuntimeProvider != "docker" {
			return fmt.Errorf("existing local Core authority differs")
		}
		if _, exists := cfg.Targets["browser-node"]; exists {
			return fmt.Errorf("isolated remote target already exists")
		}
		if _, exists := cfg.Access["remote-browser"]; exists {
			return fmt.Errorf("isolated remote access already exists")
		}
		cfg.Access["remote-browser"] = deployment.AccessDefinition{Provider: "baseharbor-node-connector", Reference: "node-browser"}
		cfg.Targets["browser-node"] = deployment.TargetDefinition{TenantID: "11111111-1111-4111-8111-111111111111", Runtime: deployment.RuntimeDefinition{Provider: runtime}, Access: deployment.TargetAccess{Reference: "remote-browser"}, Scope: "remote"}
		return cfg.Save()
	}
	if len(os.Args) != 1 {
		return fmt.Errorf("unsupported signing helper argument")
	}
	root := os.Getenv("BASEHARBOR_BROWSER_FIXTURE")
	if !filepath.IsAbs(root) {
		return fmt.Errorf("absolute isolated fixture required")
	}
	state := filepath.Join(root, "data", "baseharbor", "targets", "browser-runtime", "runtime")
	files, err := bhruntime.ExistingFilesForProject(state, bhruntime.SharedProjectName("browser-runtime"))
	if err != nil {
		return err
	}
	issuer := openbao.NewServiceIssuer(bhruntime.NewCLIBackend("docker", "compose"), files)
	key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		return err
	}
	identity, _ := url.Parse("spiffe://baseharbor/platform/core/browser-connector")
	csr, err := x509.CreateCertificateRequest(rand.Reader, &x509.CertificateRequest{URIs: []*url.URL{identity}, DNSNames: []string{"localhost"}}, key)
	if err != nil {
		return err
	}
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	certificate, err := issuer.SignCoreCSR(ctx, serviceaccess.CSRSigningRequest{CSRPEM: pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE REQUEST", Bytes: csr}), Identity: identity.String(), DNSNames: []string{"localhost"}, TTL: time.Hour})
	if err != nil {
		return err
	}
	trust, err := issuer.TrustBundle(ctx)
	if err != nil {
		return err
	}
	encoded, err := x509.MarshalPKCS8PrivateKey(key)
	if err != nil {
		return err
	}
	for name, content := range map[string][]byte{"connector-core.crt": certificate.Certificate, "connector-core.key": pem.EncodeToMemory(&pem.Block{Type: "PRIVATE KEY", Bytes: encoded}), "connector-ca.pem": trust.PEM} {
		if err := os.WriteFile(filepath.Join(root, name), content, 0600); err != nil {
			return err
		}
	}
	return nil
}
