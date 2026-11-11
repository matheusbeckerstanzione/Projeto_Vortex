package neocore.Repository;

import neocore.Model.EmpresaGitHub;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface EmpresaGitHubRepository
        extends JpaRepository<EmpresaGitHub, UUID> {
}