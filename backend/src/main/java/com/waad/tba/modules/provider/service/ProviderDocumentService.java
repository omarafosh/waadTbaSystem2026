package com.waad.tba.modules.provider.service;

import com.waad.tba.modules.provider.dto.ProviderDocumentDto;
import com.waad.tba.modules.provider.entity.Provider;
import com.waad.tba.modules.provider.entity.ProviderDocument;
import com.waad.tba.modules.provider.repository.ProviderDocumentRepository;
import com.waad.tba.modules.provider.repository.ProviderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProviderDocumentService {

    private final ProviderDocumentRepository documentRepository;
    private final ProviderRepository providerRepository;
    private final com.waad.tba.common.file.FileStorageService fileStorageService;

    @Transactional(readOnly = true)
    public List<ProviderDocumentDto> getDocuments(Long providerId) {
        return documentRepository.findByProviderIdAndActiveTrue(providerId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProviderDocumentDto addDocument(ProviderDocumentDto dto, org.springframework.web.multipart.MultipartFile file) {
        Provider provider = providerRepository.findById(dto.getProviderId())
                .orElseThrow(() -> new RuntimeException("Provider not found"));

        String fileUrl = dto.getFileUrl();
        String fileName = dto.getFileName();

        if (file != null && !file.isEmpty()) {
            var result = fileStorageService.upload(file, "providers/" + provider.getId());
            fileUrl = result.getUrl();
            fileName = result.getFileName(); // Use stored filename
        }

        ProviderDocument doc = ProviderDocument.builder()
                .provider(provider)
                .type(dto.getType())
                .fileName(fileName)
                .fileUrl(fileUrl)
                .documentNumber(dto.getDocumentNumber())
                .expiryDate(dto.getExpiryDate())
                .notes(dto.getNotes())
                .active(true)
                .build();

        doc = documentRepository.save(doc);
        return toDto(doc);
    }

    @Transactional
    public void deleteDocument(Long id) {
        ProviderDocument doc = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        // Delete physical file
        if (doc.getFileUrl() != null && doc.getFileUrl().contains("key=")) {
            try {
                String fullUrl = doc.getFileUrl();
                String encodedKey = fullUrl.substring(fullUrl.indexOf("key=") + 4);
                String fileKey = java.net.URLDecoder.decode(encodedKey, java.nio.charset.StandardCharsets.UTF_8);
                fileStorageService.delete(fileKey);
            } catch (Exception e) {
                // Log error but continue with soft delete
                System.err.println("Failed to delete physical file: " + e.getMessage());
            }
        }

        documentRepository.delete(doc);
    }

    private ProviderDocumentDto toDto(ProviderDocument doc) {
        return ProviderDocumentDto.builder()
                .id(doc.getId())
                .providerId(doc.getProvider().getId())
                .type(doc.getType())
                .fileName(doc.getFileName())
                .fileUrl(doc.getFileUrl())
                .documentNumber(doc.getDocumentNumber())
                .expiryDate(doc.getExpiryDate())
                .notes(doc.getNotes())
                .build();
    }
}
