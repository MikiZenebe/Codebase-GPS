import { useRef, useState } from "react";
import { ArrowLeft, UploadCloud, FileArchive, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { AiFillGithub } from "react-icons/ai";

import {
  useConnectGitHubMutation,
  useUploadRepositoryMutation,
} from "../services/projectApi";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";

export default function NewProjectPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [activeOption, setActiveOption] = useState<"upload" | "github">(
    "upload",
  );

  const [uploadRepository, uploadState] = useUploadRepositoryMutation();

  const [connectGitHub, githubState] = useConnectGitHubMutation();

  const loading = uploadState.isLoading || githubState.isLoading;

  const [error, setError] = useState("");

  const handleFileChange = (file?: File) => {
    if (!file) return;

    setError("");

    if (!file.name.toLowerCase().endsWith(".zip")) {
      setError("Please select a ZIP archive.");
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a repository ZIP file.");
      return;
    }

    try {
      setError("");

      const project = await uploadRepository({
        file: selectedFile,
      }).unwrap();

      navigate(`/projects/${project.id}`);
    } catch {
      setError("Unable to upload repository. Please try again.");
    }
  };

  const handleGitHubConnect = async () => {
    if (!repositoryUrl.trim()) {
      setError("Please enter a GitHub repository URL.");
      return;
    }

    const validGitHubUrl = /^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/.test(
      repositoryUrl.trim(),
    );

    if (!validGitHubUrl) {
      setError("Enter a valid GitHub repository URL.");
      return;
    }

    try {
      setError("");

      const project = await connectGitHub({
        repositoryUrl: repositoryUrl.trim(),
      }).unwrap();

      navigate(`/projects/${project.id}`);
    } catch {
      setError(
        "Unable to connect repository. Check your access and try again.",
      );
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Link
        to="/projects"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={16} />
        Back to projects
      </Link>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Add a new codebase
        </h1>

        <p className="text-muted-foreground">
          Bring your repository into Codebase GPS to start understanding your
          code.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={() => {
            setActiveOption("upload");
            setError("");
          }}
          className={`rounded-xl border p-5 text-left transition-all ${
            activeOption === "upload"
              ? "border-primary bg-primary/5 ring-1 ring-primary"
              : "hover:bg-muted/50"
          }`}
        >
          <UploadCloud className="mb-4 size-7" />

          <h2 className="font-semibold">Upload repository</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Upload your project as a ZIP file.
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveOption("github");
            setError("");
          }}
          className={`rounded-xl border p-5 text-left transition-all ${
            activeOption === "github"
              ? "border-primary bg-primary/5 ring-1 ring-primary"
              : "hover:bg-muted/50"
          }`}
        >
          <AiFillGithub className="mb-4 size-7" />

          <h2 className="font-semibold">Connect GitHub</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Import a repository from GitHub.
          </p>
        </button>
      </div>

      {activeOption === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle>Upload your repository</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                handleFileChange(event.dataTransfer.files[0]);
              }}
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition hover:border-primary hover:bg-muted/40"
            >
              <UploadCloud className="mb-4 size-10 text-muted-foreground" />

              <p className="font-medium">Drag and drop your repository here</p>

              <p className="mt-2 text-sm text-muted-foreground">
                Or click to browse your files
              </p>

              <p className="mt-3 text-xs text-muted-foreground">
                ZIP archives only
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".zip,application/zip"
                className="hidden"
                onChange={(event) => handleFileChange(event.target.files?.[0])}
              />
            </div>

            {selectedFile && (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <FileArchive className="text-primary" />

                  <div>
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedFile(null)}
                >
                  <X size={16} />
                </Button>
              </div>
            )}

            <Button
              className="w-full"
              disabled={!selectedFile || loading}
              onClick={handleUpload}
            >
              {uploadState.isLoading
                ? "Uploading..."
                : "Upload and analyze repository"}
            </Button>
          </CardContent>
        </Card>
      )}

      {activeOption === "github" && (
        <Card>
          <CardHeader>
            <CardTitle>Connect a GitHub repository</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="github-url">GitHub repository URL</Label>

              <Input
                id="github-url"
                placeholder="https://github.com/username/repository"
                value={repositoryUrl}
                onChange={(event) => setRepositoryUrl(event.target.value)}
              />

              <p className="text-xs text-muted-foreground">
                Enter the repository URL. Private repositories require GitHub
                authorization.
              </p>
            </div>

            <Button
              className="w-full"
              disabled={!repositoryUrl.trim() || loading}
              onClick={handleGitHubConnect}
            >
              <AiFillGithub size={17} />
              {githubState.isLoading ? "Connecting..." : "Connect repository"}
            </Button>
          </CardContent>
        </Card>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
