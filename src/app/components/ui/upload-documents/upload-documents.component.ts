import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface UploadFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  errorMessage?: string;
}

@Component({
  selector: 'app-upload-documents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './upload-documents.component.html',
  styleUrls: ['./upload-documents.component.css']
})
export class UploadDocumentsComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  files: UploadFile[] = [];
  isDragging = false;
  
  readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  readonly SUPPORTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

  onFileSelected(event: any): void {
    const selectedFiles: FileList = event.target.files;
    this.handleFiles(selectedFiles);
  }

  onFileDropped(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    if (event.dataTransfer?.files) {
      this.handleFiles(event.dataTransfer.files);
    }
  }

  private handleFiles(fileList: FileList): void {
    Array.from(fileList).forEach(file => {
      if (this.validateFile(file)) {
        this.addFile(file);
      }
    });
  }

  private validateFile(file: File): boolean {
    if (file.size > this.MAX_FILE_SIZE) {
      alert(`File ${file.name} is too large. Maximum size is 10MB.`);
      return false;
    }
    if (!this.SUPPORTED_TYPES.includes(file.type)) {
      alert(`File ${file.name} has an unsupported type.`);
      return false;
    }
    return true;
  }

  private addFile(file: File): void {
    const uploadFile: UploadFile = {
      file,
      progress: 0,
      status: 'pending'
    };
    this.files.push(uploadFile);
  }

  removeFile(index: number): void {
    this.files.splice(index, 1);
  }

  async uploadFiles(): Promise<void> {
    const pendingFiles = this.files.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    for (const uploadFile of pendingFiles) {
      uploadFile.status = 'uploading';
      
      try {
        await this.simulateUpload(uploadFile);
        uploadFile.status = 'completed';
      } catch (error) {
        uploadFile.status = 'error';
        uploadFile.errorMessage = 'Upload failed';
      }
    }
  }

  private simulateUpload(uploadFile: UploadFile): Promise<void> {
    return new Promise((resolve, reject) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        uploadFile.progress = Math.min(progress, 100);
        
        if (uploadFile.progress >= 100) {
          clearInterval(interval);
          // Simulate occasional failure
          if (Math.random() > 0.9) {
            reject(new Error('Network error'));
          } else {
            resolve();
          }
        }
      }, 200);
    });
  }

  formatSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
