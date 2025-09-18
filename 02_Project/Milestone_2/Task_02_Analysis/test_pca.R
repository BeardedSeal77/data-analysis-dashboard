# Example: load one of your PCA results
pca_res <- readRDS("02_Project/Milestone_2/Task_02_Analysis/pca/access-to-health-care_national_zaf_pca.rds")

# Inspect structure
str(pca_res)

# View eigenvalues (variance explained)
pca_res$eig

# View variable contributions
pca_res$var$contrib

# View coordinates of variables on PCs
pca_res$var$coord
